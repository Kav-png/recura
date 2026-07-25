import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

export const DEMO_CLINICIAN_NAME = "Dr. Maria Alvarez";

export async function getDemoClinician() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("clinicians")
    .select("*, practices(id, name)")
    .eq("name", DEMO_CLINICIAN_NAME)
    .single();
  if (error) throw error;
  return data;
}

export async function getPatientPanel(practiceId: string) {
  const supabase = supabaseServer();
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

  return patients.map((p) => ({
    ...p,
    clinicianName: p.clinicians?.name ?? null,
    latestCheckin: latestCheckinByPatient.get(p.id) ?? null,
    status: worstAlertByPatient.get(p.id) ?? "stable",
  }));
}

export async function getPatientDetail(patientId: string) {
  const supabase = supabaseServer();

  const [{ data: patient, error: pErr }, meds, flags, checkins, alerts, billing, wearableEvents] = await Promise.all([
    supabase
      .from("patients")
      .select(
        "*, clinicians!patients_clinician_id_fkey(name, role), tcm_clinician:clinicians!patients_tcm_contact_by_fkey(name), rpm_clinician:clinicians!patients_rpm_live_contact_by_fkey(name)"
      )
      .eq("id", patientId)
      .single(),
    supabase.from("medications").select("*").eq("patient_id", patientId).order("name"),
    supabase.from("red_flags").select("*").eq("patient_id", patientId).order("severity", { ascending: false }),
    supabase.from("checkins").select("*").eq("patient_id", patientId).order("called_at", { ascending: true }),
    supabase.from("alerts").select("*").eq("patient_id", patientId).order("sent_at", { ascending: false }),
    supabase.from("billing_events").select("*").eq("patient_id", patientId).order("code"),
    supabase.from("wearable_events").select("*").eq("patient_id", patientId).order("detected_at", { ascending: false }),
  ]);

  if (pErr) throw pErr;

  return {
    patient,
    medications: meds.data ?? [],
    redFlags: flags.data ?? [],
    checkins: checkins.data ?? [],
    alerts: alerts.data ?? [],
    billing: billing.data ?? [],
    wearableEvents: wearableEvents.data ?? [],
  };
}

export async function getAlertsPanel(practiceId: string) {
  const supabase = supabaseServer();
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
  const supabase = supabaseServer();
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
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, condition, discharge_date")
    .eq("practice_id", practiceId)
    .order("name");
  if (error) throw error;
  return data;
}

export async function getPracticeOverview(practiceId: string) {
  const supabase = supabaseServer();

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
