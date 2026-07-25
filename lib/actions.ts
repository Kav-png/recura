"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { getCurrentClinician } from "@/lib/queries";
import { SESSION_COOKIE, isValidAccessCode, sessionTokenForCode, PATIENT_SESSION_COOKIE, patientSessionCookieValue } from "@/lib/auth";
import { pickPrimaryMedication, promQuestionFor, type TranscriptLine } from "@/lib/checkinExtraction";
import { computeExpectedBilling } from "@/lib/billing";
import { emergencyNumberFor, isCountryCode } from "@/lib/emergency";
import { persistCheckin } from "@/lib/checkinPersist";
import { logAudit } from "@/lib/audit";
import { DEMO_ADMIN_EMAIL, DEMO_CLINICIAN_PASSWORD } from "@/lib/demoClinicians";
import { generatePatientAccessCode } from "@/lib/patientAccessCode";

export type LiveContactMethod = "phone_live" | "video_live" | "in_person";
export type TcmMdmLevel = "moderate" | "high";

/**
 * Real billing automation: recomputes billing_events for a patient purely from the compliance
 * fields a clinician has actually logged (see computeExpectedBilling), and replaces whatever rows
 * exist with the freshly-derived set. This is what turns "billing captured" from a hand-seeded
 * demo number into something the app actually derives from clinician actions.
 */
export async function reconcileBillingForPatient(patientId: string) {
  const supabase = await supabaseServer();
  const { data: patient, error } = await supabase
    .from("patients")
    .select(
      "discharge_date, tcm_contact_done, tcm_contact_by, tcm_contact_method, tcm_contact_date, tcm_med_reconciliation_at, tcm_mdm_level, f2f_scheduled_date, rpm_days_this_period, rpm_live_contact_at, rpm_live_contact_by, rpm_live_contact_method, rpm_live_contact_minutes"
    )
    .eq("id", patientId)
    .maybeSingle();
  if (error) throw error;
  if (!patient) return;

  const expected = computeExpectedBilling(patient);

  const { error: delErr } = await supabase.from("billing_events").delete().eq("patient_id", patientId);
  if (delErr) throw delErr;

  if (expected.length > 0) {
    const { error: insErr } = await supabase
      .from("billing_events")
      .insert(expected.map((e) => ({ patient_id: patientId, ...e })));
    if (insErr) throw insErr;
  }

  revalidatePath("/doctor", "layout");
  revalidatePath("/practice", "layout");
}

/** Logs the TCM 2-day interactive contact — must be a live/synchronous clinician touch (research/03). */
export async function recordTcmContact(patientId: string, method: LiveContactMethod) {
  const supabase = await supabaseServer();
  const clinician = await getCurrentClinician();

  const { error } = await supabase
    .from("patients")
    .update({
      tcm_contact_done: true,
      tcm_contact_date: new Date().toISOString(),
      tcm_contact_by: clinician.id,
      tcm_contact_method: method,
    })
    .eq("id", patientId);
  if (error) throw error;

  await logAudit("record_tcm_contact", { patientId, metadata: { method } });
  await reconcileBillingForPatient(patientId);
}

/**
 * Logs medication reconciliation — a required element of the TCM service itself (CMS TCM
 * requirements, research/03), not just a nice-to-have note. The live 2-day contact alone can't
 * bill until this is on file too.
 */
export async function recordTcmMedReconciliation(patientId: string) {
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("patients")
    .update({ tcm_med_reconciliation_at: new Date().toISOString() })
    .eq("id", patientId);
  if (error) throw error;

  await reconcileBillingForPatient(patientId);
}

/**
 * Records the clinician-documented medical-decision-making complexity that CMS actually keys
 * 99495 vs 99496 off of (research/03) — distinct from the F2F-day proxy used when no level has
 * been logged yet.
 */
export async function recordTcmMdmLevel(patientId: string, level: TcmMdmLevel) {
  const supabase = await supabaseServer();

  const { error } = await supabase.from("patients").update({ tcm_mdm_level: level }).eq("id", patientId);
  if (error) throw error;

  await reconcileBillingForPatient(patientId);
}

/** Logs the RPM/RTM monthly live interactive communication touch — same live-contact requirement as TCM. */
export async function recordRpmLiveContact(patientId: string, method: LiveContactMethod, minutes: number) {
  const supabase = await supabaseServer();
  const clinician = await getCurrentClinician();

  const { error } = await supabase
    .from("patients")
    .update({
      rpm_live_contact_at: new Date().toISOString(),
      rpm_live_contact_by: clinician.id,
      rpm_live_contact_method: method,
      rpm_live_contact_minutes: minutes,
    })
    .eq("id", patientId);
  if (error) throw error;

  await logAudit("record_rpm_live_contact", { patientId, metadata: { method, minutes } });
  await reconcileBillingForPatient(patientId);
}

/** Records a day of RPM device data — pure volume/ingestion work, safe to automate (no live-contact requirement). */
export async function logRpmDeviceDay(patientId: string) {
  const supabase = await supabaseServer();
  const { data: patient, error: pErr } = await supabase
    .from("patients")
    .select("rpm_days_this_period")
    .eq("id", patientId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!patient) throw new Error("This patient no longer exists — the page may be out of date, try reloading.");

  const { error } = await supabase
    .from("patients")
    .update({ rpm_days_this_period: Math.min(patient.rpm_days_this_period + 1, 30) })
    .eq("id", patientId);
  if (error) throw error;

  await reconcileBillingForPatient(patientId);
}

export async function scheduleF2F(patientId: string, date: string) {
  if (!date) throw new Error("Date is required.");
  const supabase = await supabaseServer();

  const { error } = await supabase.from("patients").update({ f2f_scheduled_date: date }).eq("id", patientId);
  if (error) throw error;

  await reconcileBillingForPatient(patientId);
}

// Patient-portal login only (no clinician account — see proxy.ts). Kept as the shared practice
// access code since a real patient never has, and shouldn't need, individual credentials.
export async function submitAccessCode(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const next = String(formData.get("next") ?? "/patient");

  if (next.startsWith("/patient")) {
    if (isValidAccessCode(code)) {
      const cookieStore = await cookies();
      // Clear any lingering single-patient session — otherwise proxy.ts's patient-scoped cookie
      // (which deliberately takes priority) would keep this browser pinned to that one patient
      // even after the shared staff code is used to get back to the picker.
      cookieStore.delete(PATIENT_SESSION_COOKIE);
      cookieStore.set(SESSION_COOKIE, sessionTokenForCode(code), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12,
      });
      redirect(next.startsWith("/") ? next : "/patient");
    }

    // Not the shared practice code — check whether it's one patient's own portal code
    // (lib/patientAccessCode.ts). That session is scoped to exactly that patient by proxy.ts,
    // regardless of what `next` asked for.
    const supabase = await supabaseServer();
    const { data: patient } = await supabase.from("patients").select("id").eq("access_code", code).maybeSingle();
    if (!patient) {
      redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
    }

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    cookieStore.set(PATIENT_SESSION_COOKIE, patientSessionCookieValue(patient.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect(`/patient/${patient.id}`);
  }

  if (!isValidAccessCode(code)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  // Shared demo code, but heading for a clinician-facing route (/doctor, /practice, /settings):
  // those require a real Supabase Auth session for RLS to scope anything, so the code is a
  // shortcut into the admin account, not a second auth system. Real clinicians in production would
  // use their own email/password (still available on the same login page).
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_CLINICIAN_PASSWORD,
  });
  if (error) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  redirect(next.startsWith("/") ? next : "/doctor");
}

// Clinician login (/doctor, /practice, /settings) — real per-clinician Supabase Auth so RLS can
// scope patient visibility by clinician_id (see migration add_clinician_auth_and_audit_log).
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/doctor");

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  redirect(next.startsWith("/") && !next.startsWith("/patient") ? next : "/doctor");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function reviewAlert(alertId: string, action: "call_patient" | "bring_in" | "escalate_911" | "none") {
  const supabase = await supabaseServer();
  const clinician = await getCurrentClinician();

  const { error } = await supabase
    .from("alerts")
    .update({
      reviewed_by: clinician.id,
      reviewed_at: new Date().toISOString(),
      action_taken: action,
    })
    .eq("id", alertId);

  if (error) throw error;

  await logAudit("review_alert", { metadata: { alertId, action } });

  revalidatePath("/doctor", "layout");
}

export async function unreviewAlert(alertId: string) {
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("alerts")
    .update({ reviewed_by: null, reviewed_at: null, action_taken: null })
    .eq("id", alertId);

  if (error) throw error;

  revalidatePath("/doctor", "layout");
}

/**
 * Country choice drives the emergency number quoted everywhere in real time (alert messages,
 * patient portal copy) — see lib/emergency.ts. Seeded/historical transcript text is not rewritten.
 */
export async function setPracticeCountry(country: string) {
  if (!isCountryCode(country)) throw new Error(`Unsupported country code: ${country}`);

  const supabase = await supabaseServer();
  const clinician = await getCurrentClinician();

  const { error } = await supabase
    .from("practices")
    .update({ country })
    .eq("id", clinician.practice_id);

  if (error) throw error;

  revalidatePath("/doctor", "layout");
  revalidatePath("/patient", "layout");
  revalidatePath("/settings");
}

export type NewPatientInput = {
  name: string;
  phone: string;
  condition: "HF" | "COPD" | "AMI" | "Pneumonia";
  dischargeDate: string;
};

export async function addPatient(input: NewPatientInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Patient name is required.");
  if (!input.dischargeDate) throw new Error("Discharge date is required.");

  const supabase = await supabaseServer();
  const clinician = await getCurrentClinician();
  const now = new Date().toISOString();

  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      practice_id: clinician.practice_id,
      clinician_id: clinician.id,
      name,
      phone: input.phone.trim() || null,
      condition: input.condition,
      discharge_date: input.dischargeDate,
      is_demo: true,
      enrolled_at: now,
      consent_captured_at: now,
      access_code: generatePatientAccessCode(),
    })
    .select()
    .single();
  if (error) throw error;

  await logAudit("add_patient", { patientId: patient.id });

  revalidatePath("/doctor", "layout");
  return patient;
}

export async function startCheckin(patientId: string) {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) throw new Error("ELEVENLABS_AGENT_ID is not configured");

  const supabase = await supabaseServer();
  const [{ data: patient, error: pErr }, { data: medications, error: mErr }] = await Promise.all([
    supabase.from("patients").select("name, condition, practices(country)").eq("id", patientId).maybeSingle(),
    supabase.from("medications").select("name, status").eq("patient_id", patientId),
  ]);
  if (pErr) throw pErr;
  if (mErr) throw mErr;
  if (!patient) throw new Error("This patient no longer exists — the page may be out of date, try reloading.");

  const medicationName = pickPrimaryMedication(medications ?? []);

  return {
    agentId,
    dynamicVariables: {
      patient_first_name: patient.name.split(" ")[0],
      condition: patient.condition,
      medication_name: medicationName,
      prom_question: promQuestionFor(patient.condition),
      // Only takes effect once the agent's own system prompt (configured in the ElevenLabs
      // dashboard) references {{emergency_number}} instead of a hardcoded number — see
      // lib/emergency.ts for the country → number mapping driven by the Settings page.
      emergency_number: emergencyNumberFor(patient.practices?.country),
    },
  };
}

export async function saveCheckin(patientId: string, transcript: TranscriptLine[]) {
  const supabase = await supabaseServer();
  const result = await persistCheckin(supabase, patientId, transcript);
  revalidatePath("/doctor", "layout");
  return result;
}
