"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { getDemoClinician } from "@/lib/queries";
import { SESSION_COOKIE, isValidAccessCode, sessionTokenForCode } from "@/lib/auth";
import { extractCheckin, pickPrimaryMedication, promQuestionFor, type TranscriptLine } from "@/lib/checkinExtraction";
import { computeExpectedBilling } from "@/lib/billing";

export type LiveContactMethod = "phone_live" | "video_live" | "in_person";

/**
 * Real billing automation: recomputes billing_events for a patient purely from the compliance
 * fields a clinician has actually logged (see computeExpectedBilling), and replaces whatever rows
 * exist with the freshly-derived set. This is what turns "billing captured" from a hand-seeded
 * demo number into something the app actually derives from clinician actions.
 */
export async function reconcileBillingForPatient(patientId: string) {
  const supabase = supabaseServer();
  const { data: patient, error } = await supabase
    .from("patients")
    .select(
      "discharge_date, tcm_contact_done, tcm_contact_by, tcm_contact_method, f2f_scheduled_date, rpm_days_this_period, rpm_live_contact_at, rpm_live_contact_by, rpm_live_contact_method"
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
  const supabase = supabaseServer();
  const clinician = await getDemoClinician();

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

  await reconcileBillingForPatient(patientId);
}

/** Logs the RPM/RTM monthly live interactive communication touch — same live-contact requirement as TCM. */
export async function recordRpmLiveContact(patientId: string, method: LiveContactMethod) {
  const supabase = supabaseServer();
  const clinician = await getDemoClinician();

  const { error } = await supabase
    .from("patients")
    .update({
      rpm_live_contact_at: new Date().toISOString(),
      rpm_live_contact_by: clinician.id,
      rpm_live_contact_method: method,
    })
    .eq("id", patientId);
  if (error) throw error;

  await reconcileBillingForPatient(patientId);
}

/** Records a day of RPM device data — pure volume/ingestion work, safe to automate (no live-contact requirement). */
export async function logRpmDeviceDay(patientId: string) {
  const supabase = supabaseServer();
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
  const supabase = supabaseServer();

  const { error } = await supabase.from("patients").update({ f2f_scheduled_date: date }).eq("id", patientId);
  if (error) throw error;

  await reconcileBillingForPatient(patientId);
}

export async function submitAccessCode(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const next = String(formData.get("next") ?? "/doctor");

  if (!isValidAccessCode(code)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionTokenForCode(code), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect(next.startsWith("/") ? next : "/doctor");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function reviewAlert(alertId: string, action: "call_patient" | "bring_in" | "escalate_911" | "none") {
  const supabase = supabaseServer();
  const clinician = await getDemoClinician();

  const { error } = await supabase
    .from("alerts")
    .update({
      reviewed_by: clinician.id,
      reviewed_at: new Date().toISOString(),
      action_taken: action,
    })
    .eq("id", alertId);

  if (error) throw error;

  revalidatePath("/doctor", "layout");
}

export async function unreviewAlert(alertId: string) {
  const supabase = supabaseServer();

  const { error } = await supabase
    .from("alerts")
    .update({ reviewed_by: null, reviewed_at: null, action_taken: null })
    .eq("id", alertId);

  if (error) throw error;

  revalidatePath("/doctor", "layout");
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

  const supabase = supabaseServer();
  const clinician = await getDemoClinician();
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
    })
    .select()
    .single();
  if (error) throw error;

  revalidatePath("/doctor", "layout");
  return patient;
}

export async function startCheckin(patientId: string) {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) throw new Error("ELEVENLABS_AGENT_ID is not configured");

  const supabase = supabaseServer();
  const [{ data: patient, error: pErr }, { data: medications, error: mErr }] = await Promise.all([
    supabase.from("patients").select("name, condition").eq("id", patientId).maybeSingle(),
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
    },
  };
}

export async function saveCheckin(patientId: string, transcript: TranscriptLine[]) {
  const supabase = supabaseServer();
  const [{ data: patient, error: pErr }, { data: medications, error: mErr }] = await Promise.all([
    supabase.from("patients").select("condition, clinician_id").eq("id", patientId).maybeSingle(),
    supabase.from("medications").select("name, status").eq("patient_id", patientId),
  ]);
  if (pErr) throw pErr;
  if (mErr) throw mErr;
  if (!patient) throw new Error("This patient no longer exists — the page may be out of date, try reloading.");

  const medicationName = pickPrimaryMedication(medications ?? []);
  const result = extractCheckin({ condition: patient.condition, medicationName, transcript });

  const { data: checkin, error: cErr } = await supabase
    .from("checkins")
    .insert({
      patient_id: patientId,
      called_at: new Date().toISOString(),
      transcript,
      summary: result.summary,
      mood: result.mood,
      proms_score: result.proms_score,
      flags_raised: result.flags_raised,
    })
    .select()
    .single();
  if (cErr) throw cErr;

  if (result.severity && result.alertMessage) {
    const { error: aErr } = await supabase.from("alerts").insert({
      patient_id: patientId,
      checkin_id: checkin.id,
      severity: result.severity,
      message: result.alertMessage,
      clinician_id: patient.clinician_id,
      sent_at: new Date().toISOString(),
    });
    if (aErr) throw aErr;
  }

  revalidatePath("/doctor", "layout");
  return { checkinId: checkin.id, severity: result.severity };
}
