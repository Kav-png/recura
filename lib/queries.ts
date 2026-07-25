import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

/**
 * The real, logged-in clinician behind the current request (see migration
 * add_clinician_auth_and_audit_log — clinicians.auth_user_id ties a Supabase Auth user to a
 * clinicians row). Replaces the old hardcoded-demo-clinician lookup now that /doctor, /practice,
 * and /settings require a real per-clinician session (proxy.ts).
 */
export async function getCurrentClinician() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data, error } = await supabase
    .from("clinicians")
    .select("*, practices(id, name, country)")
    .eq("auth_user_id", user.id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * The demo practice's id, for the patient-picker page only (app/patient/page.tsx) — that page has
 * no clinician session to resolve (a real patient never logs in as a clinician; see proxy.ts), so
 * it can't use getCurrentClinician(). Relies on the same anon/is_demo=true RLS policies that gate
 * the shared demo practice.
 */
export async function getDemoPracticeId() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("practices").select("id").eq("is_demo", true).limit(1).single();
  if (error) throw error;
  return data.id;
}

export async function getPatientPanel(practiceId: string) {
  const supabase = await supabaseServer();
  const { data: patients, error } = await supabase
    .from("patients")
    .select("*, clinicians!patients_clinician_id_fkey(name)")
    .eq("practice_id", practiceId)
    .order("name");
  if (error) throw error;

  const { data: checkins } = await supabase
    .from("checkins")
    .select("patient_id, called_at, proms_score")
    .order("called_at", { ascending: false });

  const { data: alerts } = await supabase
    .from("alerts")
    .select("patient_id, severity, reviewed_at")
    .is("reviewed_at", null)
    .order("sent_at", { ascending: false });

  const patientIds = patients.map((p) => p.id);
  const { data: billing } = patientIds.length
    ? await supabase.from("billing_events").select("patient_id, amount, status").in("patient_id", patientIds)
    : { data: [] };

  const latestCheckinByPatient = new Map<string, { called_at: string; proms_score: number | null }>();
  for (const c of checkins ?? []) {
    if (!latestCheckinByPatient.has(c.patient_id)) {
      latestCheckinByPatient.set(c.patient_id, { called_at: c.called_at, proms_score: c.proms_score });
    }
  }

  const severityRank: Record<string, number> = { danger: 3, warn: 2, info: 1 };
  const worstAlertByPatient = new Map<string, string>();
  for (const a of alerts ?? []) {
    const current = worstAlertByPatient.get(a.patient_id);
    if (!current || severityRank[a.severity] > severityRank[current]) {
      worstAlertByPatient.set(a.patient_id, a.severity);
    }
  }

  const capturedBillingByPatient = new Map<string, number>();
  const pendingBillingByPatient = new Map<string, number>();
  for (const b of billing ?? []) {
    const target = b.status === "captured" ? capturedBillingByPatient : pendingBillingByPatient;
    target.set(b.patient_id, (target.get(b.patient_id) ?? 0) + b.amount);
  }

  return patients.map((p) => ({
    ...p,
    clinicianName: p.clinicians?.name ?? null,
    latestCheckin: latestCheckinByPatient.get(p.id) ?? null,
    status: worstAlertByPatient.get(p.id) ?? "stable",
    capturedBilling: capturedBillingByPatient.get(p.id) ?? 0,
    pendingBilling: pendingBillingByPatient.get(p.id) ?? 0,
  }));
}

export async function getPatientDetail(patientId: string) {
  const supabase = await supabaseServer();

  const [{ data: patient, error: pErr }, meds, flags, allergies, checkins, alerts, billing, wearableEvents] = await Promise.all([
    supabase
      .from("patients")
      .select(
        "*, clinicians!patients_clinician_id_fkey(name, role), tcm_clinician:clinicians!patients_tcm_contact_by_fkey(name), rpm_clinician:clinicians!patients_rpm_live_contact_by_fkey(name), practices(country)"
      )
      .eq("id", patientId)
      .maybeSingle(),
    supabase.from("medications").select("*").eq("patient_id", patientId).order("name"),
    supabase.from("red_flags").select("*").eq("patient_id", patientId).order("severity", { ascending: false }),
    supabase.from("allergies").select("*").eq("patient_id", patientId).order("allergen"),
    supabase.from("checkins").select("*").eq("patient_id", patientId).order("called_at", { ascending: true }),
    supabase.from("alerts").select("*").eq("patient_id", patientId).order("sent_at", { ascending: false }),
    supabase.from("billing_events").select("*").eq("patient_id", patientId).order("code"),
    supabase.from("wearable_events").select("*").eq("patient_id", patientId).order("detected_at", { ascending: false }),
  ]);

  if (pErr) throw pErr;

  if (patient) await logAudit("view_patient", { patientId });

  return {
    patient,
    medications: meds.data ?? [],
    redFlags: flags.data ?? [],
    allergies: allergies.data ?? [],
    checkins: checkins.data ?? [],
    alerts: alerts.data ?? [],
    billing: billing.data ?? [],
    wearableEvents: wearableEvents.data ?? [],
  };
}

export async function getAlertsPanel(practiceId: string) {
  const supabase = await supabaseServer();
  const { data: patientIds } = await supabase.from("patients").select("id").eq("practice_id", practiceId);
  const ids = (patientIds ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("alerts")
    .select("*, patients(name)")
    .in("patient_id", ids)
    .order("sent_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return data;
}

export async function getUpcomingCheckins(practiceId: string) {
  const supabase = await supabaseServer();
  const { data: patients } = await supabase
    .from("patients")
    .select("id, name")
    .eq("practice_id", practiceId);

  const { data: checkins } = await supabase
    .from("checkins")
    .select("patient_id, called_at")
    .order("called_at", { ascending: false });

  const latestByPatient = new Map<string, string>();
  for (const c of checkins ?? []) {
    if (!latestByPatient.has(c.patient_id)) latestByPatient.set(c.patient_id, c.called_at);
  }

  return (patients ?? [])
    .map((p) => {
      const last = latestByPatient.get(p.id);
      const next = last ? new Date(new Date(last).getTime() + 24 * 60 * 60 * 1000) : null;
      return { patientId: p.id, patientName: p.name, nextCheckin: next };
    })
    .filter((s) => s.nextCheckin)
    .sort((a, b) => (a.nextCheckin!.getTime() - b.nextCheckin!.getTime()))
    .slice(0, 6);
}

export async function getPatientsForPortal(practiceId: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, condition, discharge_date")
    .eq("practice_id", practiceId)
    .order("name");
  if (error) throw error;
  return data;
}

export async function getBillingDocument(patientId: string) {
  const supabase = await supabaseServer();
  const [{ data: patient, error: pErr }, { data: billing, error: bErr }] = await Promise.all([
    supabase
      .from("patients")
      .select("name, condition, discharge_date, practices(name), clinicians!patients_clinician_id_fkey(name, role)")
      .eq("id", patientId)
      .maybeSingle(),
    supabase.from("billing_events").select("code, amount, status").eq("patient_id", patientId).order("code"),
  ]);
  if (pErr) throw pErr;
  if (bErr) throw bErr;
  return { patient, billing: billing ?? [] };
}

export async function getBillingRun(practiceId: string) {
  const supabase = await supabaseServer();

  const [{ data: practice, error: prErr }, { data: patients, error: pErr }] = await Promise.all([
    supabase.from("practices").select("name").eq("id", practiceId).single(),
    supabase
      .from("patients")
      .select("id, name, condition, clinicians!patients_clinician_id_fkey(name)")
      .eq("practice_id", practiceId)
      .order("name"),
  ]);
  if (prErr) throw prErr;
  if (pErr) throw pErr;

  const patientIds = (patients ?? []).map((p) => p.id);
  const { data: billing, error: bErr } = patientIds.length
    ? await supabase.from("billing_events").select("patient_id, code, amount, status").in("patient_id", patientIds)
    : { data: [], error: null };
  if (bErr) throw bErr;

  return { practice, patients: patients ?? [], billing: billing ?? [] };
}

export async function getPracticeOverview(practiceId: string) {
  const supabase = await supabaseServer();

  const [{ data: practice, error: prErr }, { data: clinicians, error: clErr }, { data: patients, error: ptErr }] =
    await Promise.all([
      supabase.from("practices").select("*").eq("id", practiceId).single(),
      supabase.from("clinicians").select("*").eq("practice_id", practiceId).order("name"),
      supabase.from("patients").select("*").eq("practice_id", practiceId).order("name"),
    ]);
  if (prErr) throw prErr;
  if (clErr) throw clErr;
  if (ptErr) throw ptErr;

  const patientIds = (patients ?? []).map((p) => p.id);
  const { data: billing, error: bErr } = patientIds.length
    ? await supabase.from("billing_events").select("*").in("patient_id", patientIds)
    : { data: [], error: null };
  if (bErr) throw bErr;

  return {
    practice,
    clinicians: clinicians ?? [],
    patients: patients ?? [],
    billing: billing ?? [],
  };
}
