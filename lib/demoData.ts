"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { computeExpectedBilling } from "@/lib/billing";
import { DEFAULT_COUNTRY, emergencyNumberFor } from "@/lib/emergency";

const PRACTICE_NAME = "Riverside Cardiology & Pulmonology Group";
// Seed transcripts/alert text are static strings baked in at reseed time, matching whatever the
// default country is — changing the Settings country selector afterward affects new, real-time
// alerts (see lib/checkinExtraction.ts) but does not rewrite this frozen seed text.
const SEED_EMERGENCY_NUMBER = emergencyNumberFor(DEFAULT_COUNTRY);

type ClinicianKey = "doc" | "np";

const CLINICIANS: { key: ClinicianKey; name: string; role: "physician" | "nurse"; specialty: string }[] = [
  { key: "doc", name: "Dr. Maria Alvarez", role: "physician", specialty: "Cardiology & Pulmonology" },
  { key: "np", name: "Chidinma Obi, NP", role: "nurse", specialty: "Care Coordination" },
];

type TranscriptLine = { speaker: "agent" | "patient"; text: string };

// Event types match what Apple Watch actually exposes as discrete, pre-classified notifications
// (HTNF: FDA 510(k) K250507, Sept 2025 — see research/06-regulatory-compliance.md). We deliberately
// model events, not raw vitals streams: FDA non-device CDS status needs discrete, clinician-reviewable
// signals (not raw PPG/ECG waveforms), and research/05's UPMC RCT shows unfiltered streams increase
// alert fatigue and ED-routing bias. See MASTER-PLAN.md "Wearables detection layer".
type WearableEventType =
  | "hypertension_notification"
  | "irregular_rhythm_notification"
  | "high_heart_rate"
  | "low_heart_rate"
  | "fall_detected";

type PatientSeed = {
  name: string;
  phone: string;
  dischargeDaysAgo: number;
  condition: "HF" | "COPD" | "AMI" | "Pneumonia";
  clinician: ClinicianKey;
  tcmContactDone: boolean;
  tcmContactDaysAgo?: number;
  // Optional overrides for the audit-trail fields below — when omitted, sensible defaults are
  // derived (see buildTcmMedReconDone/buildTcmMdmLevel/buildRpmMinutes) so most patients don't
  // need every field spelled out. A couple of patients override these explicitly to demo the
  // "live contact happened but not yet billable" states research/03 calls out.
  tcmMedReconDone?: boolean;
  tcmMdmLevel?: "moderate" | "high";
  f2fOffsetDays: number;
  rpmDays: number;
  rpmLiveContactMinutes?: number;
  medications: { name: string; dose: string; frequency: string; status: "new" | "changed" | "stopped" | "unchanged"; reason?: string }[];
  redFlags: { severity: "info" | "warn" | "danger"; title: string; explanation: string; source: "letter" | "call" }[];
  latestCheckin: {
    hoursAgo: number;
    transcript: TranscriptLine[];
    summary: string;
    mood: string;
    proms: number;
    flagsRaised?: string[];
  };
  trend: "declining" | "stable";
  alert?: { severity: "info" | "warn" | "danger"; message: string; reviewed: boolean; action?: string; sentHoursAgo: number; source?: "call" | "wearable" };
  // Multiple discrete events over the discharge window (not a continuous stream) let the
  // doctor's timeline chart show a creeping pattern building over days, per MASTER-PLAN.md
  // "Wearables detection layer" — still event-based, never raw HR/HRV/BP waveforms.
  wearableEvents?: {
    device: string;
    eventType: WearableEventType;
    detail: string;
    severity: "info" | "warn" | "danger";
    detectedHoursAgo: number;
    linkToLatestCheckin: boolean;
  }[];
};

const PATIENTS: PatientSeed[] = [
  {
    name: "Eleanor Morgan",
    phone: "+15550101",
    dischargeDaysAgo: 3,
    condition: "HF",
    clinician: "doc",
    tcmContactDone: true,
    tcmContactDaysAgo: 2,
    f2fOffsetDays: 4,
    rpmDays: 3,
    medications: [
      { name: "Metoprolol", dose: "25mg", frequency: "8am / 8pm", status: "unchanged" },
      { name: "Lisinopril", dose: "10mg", frequency: "Once daily", status: "unchanged" },
      { name: "Furosemide", dose: "20mg", frequency: "9am", status: "new", reason: "Added to manage post-op fluid retention" },
    ],
    redFlags: [
      { severity: "warn", title: "Rising blood pressure", explanation: "Your blood pressure readings have been higher than usual over the last few check-ins. This can happen after surgery, but check with your pharmacist or GP.", source: "call" },
    ],
    latestCheckin: {
      hoursAgo: 10,
      transcript: [
        { speaker: "agent", text: "Good morning Eleanor, how are you feeling today?" },
        { speaker: "patient", text: "A bit puffy in my ankles and more tired than usual." },
        { speaker: "agent", text: "Thanks for sharing. Have you noticed any chest pain or trouble breathing?" },
        { speaker: "patient", text: "No, just the swelling." },
      ],
      summary: "Reports increased ankle swelling and fatigue, no chest pain or breathlessness.",
      mood: "tired",
      proms: 62,
      flagsRaised: ["swelling", "fatigue"],
    },
    trend: "declining",
    alert: { severity: "warn", message: "Apple Watch flagged a rising blood pressure pattern over the past 5 days.", reviewed: false, sentHoursAgo: 0.4, source: "wearable" },
    wearableEvents: [
      {
        device: "Apple Watch Series 10",
        eventType: "hypertension_notification",
        detail: "Hypertension Notification: blood pressure pattern trending upward across readings, within normal range but rising.",
        severity: "info",
        detectedHoursAgo: 54,
        linkToLatestCheckin: false,
      },
      {
        device: "Apple Watch Series 10",
        eventType: "hypertension_notification",
        detail: "Hypertension Notification: elevated blood pressure pattern persisting for a second day.",
        severity: "warn",
        detectedHoursAgo: 28,
        linkToLatestCheckin: false,
      },
      {
        device: "Apple Watch Series 10",
        eventType: "hypertension_notification",
        detail: "Hypertension Notification: elevated blood pressure pattern detected across readings over the past 5 days. Screening-level signal, not a diagnosis or a continuous BP reading.",
        severity: "warn",
        detectedHoursAgo: 0.5,
        linkToLatestCheckin: true,
      },
    ],
  },
  {
    name: "James Whitfield",
    phone: "+15550102",
    dischargeDaysAgo: 9,
    condition: "HF",
    clinician: "doc",
    tcmContactDone: true,
    tcmContactDaysAgo: 8,
    f2fOffsetDays: -1,
    rpmDays: 9,
    medications: [
      { name: "Aspirin", dose: "81mg", frequency: "Once daily", status: "unchanged" },
      { name: "Metoprolol", dose: "50mg", frequency: "Once daily", status: "changed", reason: "Dose increased from 25mg for rate control" },
    ],
    redFlags: [],
    latestCheckin: {
      hoursAgo: 20,
      transcript: [
        { speaker: "agent", text: "Good morning James, how are you doing?" },
        { speaker: "patient", text: "Feeling steady, no issues today." },
      ],
      summary: "No new symptoms reported.",
      mood: "good",
      proms: 88,
    },
    trend: "stable",
  },
  {
    name: "Priya Nandan",
    phone: "+15550103",
    dischargeDaysAgo: 1,
    condition: "HF",
    clinician: "np",
    tcmContactDone: false,
    f2fOffsetDays: 6,
    rpmDays: 1,
    medications: [
      { name: "Furosemide", dose: "40mg", frequency: "9am / 5pm", status: "new", reason: "Started for acute decompensation" },
      { name: "Lisinopril", dose: "5mg", frequency: "Once daily", status: "changed", reason: "Dose reduced due to low blood pressure" },
    ],
    redFlags: [
      { severity: "danger", title: "Severe fluid retention risk", explanation: "Your discharge letter flags a high risk of fluid buildup around the heart. Watch for sudden weight gain or swelling and check with your pharmacist or GP.", source: "letter" },
    ],
    latestCheckin: {
      hoursAgo: 3,
      transcript: [
        { speaker: "agent", text: "Good morning Priya, how are you feeling?" },
        { speaker: "patient", text: "My chest feels tight and I have not slept well, I am quite short of breath." },
        { speaker: "agent", text: `That sounds serious. Please call ${SEED_EMERGENCY_NUMBER} now — I am alerting your care team immediately.` },
      ],
      summary: "Reports chest tightness and shortness of breath. Escalated immediately per protocol.",
      mood: "distressed",
      proms: 21,
      flagsRaised: ["chest_tightness", "shortness_of_breath"],
    },
    trend: "declining",
    alert: { severity: "danger", message: `Chest tightness and shortness of breath reported — ${SEED_EMERGENCY_NUMBER} advised, immediate review required.`, reviewed: false, sentHoursAgo: 0.03 },
  },
  {
    name: "Robert Klein",
    phone: "+15550104",
    dischargeDaysAgo: 14,
    condition: "HF",
    clinician: "doc",
    tcmContactDone: true,
    tcmContactDaysAgo: 13,
    f2fOffsetDays: -4,
    rpmDays: 14,
    medications: [
      { name: "Warfarin", dose: "5mg", frequency: "Once daily", status: "stopped", reason: "Switched to apixaban" },
      { name: "Apixaban", dose: "5mg", frequency: "Twice daily", status: "new", reason: "Replaces warfarin, no INR monitoring needed" },
    ],
    redFlags: [
      { severity: "info", title: "Anticoagulant switched", explanation: "Your blood thinner was changed from warfarin to apixaban, which needs no blood test monitoring. Check with your pharmacist or GP if you have questions.", source: "letter" },
    ],
    latestCheckin: {
      hoursAgo: 24,
      transcript: [
        { speaker: "agent", text: "Good morning Robert, how are you doing?" },
        { speaker: "patient", text: "All good, back to my normal routine." },
      ],
      summary: "Stable, no new symptoms.",
      mood: "good",
      proms: 91,
    },
    trend: "stable",
    alert: { severity: "warn", message: "Apple Watch detected a possible hard fall at home; no follow-up call yet.", reviewed: false, sentHoursAgo: 2.5, source: "wearable" },
    wearableEvents: [
      {
        device: "Apple Watch Series 8",
        eventType: "fall_detected",
        detail: "Fall Detected: hard fall detected at home. Patient did not respond to the on-wrist check-in prompt within the expected window.",
        severity: "warn",
        detectedHoursAgo: 2.5,
        linkToLatestCheckin: false,
      },
    ],
  },
  {
    name: "Sofia Ibarra",
    phone: "+15550105",
    dischargeDaysAgo: 5,
    condition: "COPD",
    clinician: "np",
    tcmContactDone: true,
    tcmContactDaysAgo: 4,
    f2fOffsetDays: 2,
    rpmDays: 5,
    medications: [
      { name: "Albuterol inhaler", dose: "2 puffs", frequency: "Every 4-6h as needed", status: "unchanged" },
      { name: "Prednisone", dose: "40mg", frequency: "Once daily, tapering", status: "new", reason: "Short course for COPD exacerbation" },
    ],
    redFlags: [
      { severity: "warn", title: "Low oxygen during activity", explanation: "Your oxygen levels dipped while moving around. This is common after a COPD flare-up but check with your pharmacist or GP.", source: "call" },
    ],
    latestCheckin: {
      hoursAgo: 14,
      transcript: [
        { speaker: "agent", text: "Good morning Sofia, how is your breathing today?" },
        { speaker: "patient", text: "A little harder when I walk to the kitchen, but ok resting." },
      ],
      summary: "Mild breathlessness on exertion, comfortable at rest.",
      mood: "okay",
      proms: 58,
      flagsRaised: ["breathlessness_on_exertion"],
    },
    trend: "declining",
    alert: { severity: "warn", message: "SpO2 dipped during ambulation.", reviewed: true, action: "call_patient", sentHoursAgo: 0.8 },
  },
  {
    name: "Daniel Osei",
    phone: "+15550106",
    dischargeDaysAgo: 20,
    condition: "COPD",
    clinician: "doc",
    tcmContactDone: true,
    tcmContactDaysAgo: 19,
    f2fOffsetDays: -10,
    rpmDays: 20,
    // Demo of the duration-log gap: the live RPM touch happened but ran short, so 99457/99470
    // stay "pending" until a clinician documents ≥10 minutes (research/03 audit-trail rules).
    rpmLiveContactMinutes: 8,
    medications: [{ name: "Tiotropium", dose: "18mcg", frequency: "Once daily", status: "unchanged" }],
    redFlags: [],
    latestCheckin: {
      hoursAgo: 18,
      transcript: [
        { speaker: "agent", text: "Good morning Daniel, how is your breathing?" },
        { speaker: "patient", text: "Back to normal, no issues." },
      ],
      summary: "Stable, no new symptoms.",
      mood: "good",
      proms: 85,
    },
    trend: "stable",
  },
  {
    name: "Grace Tanaka",
    phone: "+15550107",
    dischargeDaysAgo: 7,
    condition: "HF",
    clinician: "np",
    tcmContactDone: true,
    tcmContactDaysAgo: 6,
    // Demo of the med-reconciliation gap: the live 2-day contact happened, but CMS treats
    // reconciliation as its own required TCM element, so the code stays "pending" until it's
    // logged separately (research/03 audit-trail rules).
    tcmMedReconDone: false,
    f2fOffsetDays: 0,
    rpmDays: 7,
    medications: [{ name: "Digoxin", dose: "0.125mg", frequency: "Once daily", status: "unchanged" }],
    redFlags: [],
    latestCheckin: {
      hoursAgo: 11,
      transcript: [
        { speaker: "agent", text: "Good morning Grace, how are you feeling?" },
        { speaker: "patient", text: "A little dizzy this morning but otherwise fine." },
      ],
      summary: "Mild dizziness reported, no other symptoms.",
      mood: "okay",
      proms: 71,
      flagsRaised: ["dizziness"],
    },
    trend: "stable",
    alert: { severity: "info", message: "Apple Watch flagged an irregular heart rhythm consistent with possible AFib.", reviewed: true, action: "none", sentHoursAgo: 11, source: "wearable" },
    wearableEvents: [
      {
        device: "Apple Watch Series 9",
        eventType: "irregular_rhythm_notification",
        detail: "Irregular Rhythm Notification: pattern consistent with possible atrial fibrillation detected during a period of rest.",
        severity: "info",
        detectedHoursAgo: 11.2,
        linkToLatestCheckin: true,
      },
    ],
  },
  {
    name: "Miguel Ortiz",
    phone: "+15550108",
    dischargeDaysAgo: 2,
    condition: "COPD",
    clinician: "doc",
    tcmContactDone: false,
    f2fOffsetDays: 5,
    rpmDays: 2,
    medications: [
      { name: "Albuterol inhaler", dose: "2 puffs", frequency: "Every 4-6h as needed", status: "new", reason: "Started for acute exacerbation" },
      { name: "Prednisone", dose: "60mg", frequency: "Once daily, tapering", status: "new", reason: "High-dose taper for severe exacerbation" },
    ],
    redFlags: [
      { severity: "danger", title: "Severe COPD exacerbation", explanation: "Your discharge letter notes a severe flare-up of your lung condition. Watch closely for worsening breathlessness and check with your pharmacist or GP.", source: "letter" },
    ],
    latestCheckin: {
      hoursAgo: 2,
      transcript: [
        { speaker: "agent", text: "Good morning Miguel, how are you feeling today?" },
        { speaker: "patient", text: "Very breathless, even sitting still, and my lips feel a bit blue." },
        { speaker: "agent", text: `Please call ${SEED_EMERGENCY_NUMBER} now — I am alerting your care team immediately.` },
      ],
      summary: "Severe breathlessness at rest with possible cyanosis. Escalated immediately per protocol.",
      mood: "distressed",
      proms: 15,
      flagsRaised: ["severe_breathlessness", "cyanosis"],
    },
    trend: "declining",
    alert: { severity: "danger", message: `Apple Watch flagged a high resting heart rate, followed by a call confirming severe breathlessness — ${SEED_EMERGENCY_NUMBER} advised, immediate review required.`, reviewed: false, sentHoursAgo: 0.18, source: "wearable" },
    wearableEvents: [
      {
        device: "Apple Watch Series 10",
        eventType: "high_heart_rate",
        detail: "High Heart Rate Notification: resting heart rate mildly elevated versus baseline.",
        severity: "info",
        detectedHoursAgo: 40,
        linkToLatestCheckin: false,
      },
      {
        device: "Apple Watch Series 10",
        eventType: "high_heart_rate",
        detail: "High Heart Rate Notification: resting heart rate trending higher for a second day.",
        severity: "warn",
        detectedHoursAgo: 15,
        linkToLatestCheckin: false,
      },
      {
        device: "Apple Watch Series 10",
        eventType: "high_heart_rate",
        detail: "High Heart Rate Notification: resting heart rate elevated to 118 bpm, well above baseline.",
        severity: "danger",
        detectedHoursAgo: 0.2,
        linkToLatestCheckin: true,
      },
    ],
  },
  {
    name: "Daniela Costa",
    phone: "+15550109",
    dischargeDaysAgo: 6,
    condition: "AMI",
    clinician: "doc",
    tcmContactDone: true,
    tcmContactDaysAgo: 5,
    f2fOffsetDays: 3,
    rpmDays: 6,
    medications: [
      { name: "Clopidogrel", dose: "75mg", frequency: "Once daily", status: "new", reason: "Dual antiplatelet therapy started after stent placement" },
      { name: "Atorvastatin", dose: "80mg", frequency: "Once daily", status: "new", reason: "High-intensity statin started post-MI" },
      { name: "Metoprolol", dose: "25mg", frequency: "Twice daily", status: "unchanged" },
    ],
    redFlags: [
      { severity: "warn", title: "Bruising on dual antiplatelet therapy", explanation: "You're on two blood-thinning medicines after your heart procedure, which can cause more bruising than usual. This is expected but check with your pharmacist or GP.", source: "letter" },
    ],
    latestCheckin: {
      hoursAgo: 8,
      transcript: [
        { speaker: "agent", text: "Good morning Daniela, how are you feeling today?" },
        { speaker: "patient", text: "Tired but no chest pain, just some bruising on my arm from the IV site." },
      ],
      summary: "Reports mild bruising at prior IV site, no chest pain or breathlessness.",
      mood: "okay",
      proms: 74,
      flagsRaised: ["bruising"],
    },
    trend: "stable",
  },
  {
    name: "Hassan Malik",
    phone: "+15550110",
    dischargeDaysAgo: 4,
    condition: "Pneumonia",
    clinician: "np",
    tcmContactDone: true,
    tcmContactDaysAgo: 3,
    f2fOffsetDays: 5,
    rpmDays: 4,
    medications: [
      { name: "Amoxicillin-clavulanate", dose: "875mg", frequency: "Twice daily", status: "new", reason: "7-day course for community-acquired pneumonia" },
      { name: "Albuterol inhaler", dose: "2 puffs", frequency: "Every 4-6h as needed", status: "unchanged" },
    ],
    redFlags: [
      { severity: "warn", title: "Persistent low-grade fever", explanation: "Your temperature has stayed mildly raised a few days into your antibiotic course. This can be normal early on, but check with your pharmacist or GP if it continues.", source: "call" },
    ],
    latestCheckin: {
      hoursAgo: 12,
      transcript: [
        { speaker: "agent", text: "Good morning Hassan, how is your breathing and temperature today?" },
        { speaker: "patient", text: "Still a bit of a cough and I feel warm, but breathing is easier than yesterday." },
      ],
      summary: "Reports persistent cough and low-grade fever, breathing improving.",
      mood: "okay",
      proms: 65,
      flagsRaised: ["cough", "low_grade_fever"],
    },
    trend: "stable",
  },
];

const HF_LINES = ["A little tired but otherwise okay.", "Feeling steady today.", "Some mild swelling in my ankles."];
const COPD_LINES = ["Breathing feels a bit easier today.", "About the same as yesterday.", "A little more short of breath than usual."];
const AMI_LINES = ["No chest pain, feeling steady.", "A little tired but recovering well.", "Some soreness at the procedure site."];
const PNEUMONIA_LINES = ["Cough is improving, breathing easier.", "Still a mild cough but no fever.", "Feeling stronger today."];

const CONDITION_LINES: Record<PatientSeed["condition"], string[]> = {
  HF: HF_LINES,
  COPD: COPD_LINES,
  AMI: AMI_LINES,
  Pneumonia: PNEUMONIA_LINES,
};

function historicalCheckins(patient: PatientSeed) {
  const lines = CONDITION_LINES[patient.condition];
  const checkins: { daysAgo: number; transcript: TranscriptLine[]; summary: string; mood: "okay" | "good" | "tired"; proms: number }[] = [];
  let proms = patient.latestCheckin.proms;
  for (let offset = 1; offset <= 4; offset++) {
    const step = patient.trend === "declining" ? -5 : 2;
    const jitter = ((offset * 7 + patient.name.length) % 7) - 3;
    proms = Math.max(40, Math.min(95, proms + step + jitter));
    const mood = (["okay", "good", "tired"] as const)[offset % 3];
    checkins.push({
      daysAgo: offset,
      transcript: [
        { speaker: "agent", text: `Good morning ${patient.name.split(" ")[0]}, how are you feeling today?` },
        { speaker: "patient", text: lines[offset % 3] },
      ],
      summary: offset >= 3 ? "Early post-discharge check-in, mild symptoms consistent with recovery." : "Routine check-in, no acute concerns.",
      mood,
      proms,
    });
  }
  return checkins;
}

export async function reloadDemoData() {
  if (process.env.DEMO_RESEED_ENABLED !== "true") {
    throw new Error(
      "Demo reseed is disabled in this environment. Set DEMO_RESEED_ENABLED=true to allow it."
    );
  }

  const supabase = supabaseServer();

  // Wipe only is_demo=true data, scoped explicitly by ID rather than a bare
  // table-wide delete — RLS enforces this same boundary at the database
  // level (anon key can only see/touch is_demo=true rows), but a real patient
  // must never depend on RLS alone to survive a reseed.
  const { data: demoPractices, error: practicesReadErr } = await supabase
    .from("practices")
    .select("id")
    .eq("is_demo", true);
  if (practicesReadErr) throw practicesReadErr;
  const demoPracticeIds = (demoPractices ?? []).map((p) => p.id);

  const { data: demoPatients, error: patientsReadErr } = await supabase
    .from("patients")
    .select("id")
    .eq("is_demo", true);
  if (patientsReadErr) throw patientsReadErr;
  const demoPatientIds = (demoPatients ?? []).map((p) => p.id);

  if (demoPatientIds.length > 0) {
    for (const table of ["billing_events", "alerts", "wearable_events", "checkins", "red_flags", "medications"] as const) {
      const { error } = await supabase.from(table).delete().in("patient_id", demoPatientIds);
      if (error) throw error;
    }
    const { error } = await supabase.from("patients").delete().in("id", demoPatientIds);
    if (error) throw error;
  }

  if (demoPracticeIds.length > 0) {
    const { error: clinErr } = await supabase.from("clinicians").delete().in("practice_id", demoPracticeIds);
    if (clinErr) throw clinErr;
    const { error: pracErr } = await supabase.from("practices").delete().in("id", demoPracticeIds);
    if (pracErr) throw pracErr;
  }

  const { data: practice, error: practiceErr } = await supabase
    .from("practices")
    .insert({ name: PRACTICE_NAME, is_demo: true, country: DEFAULT_COUNTRY })
    .select()
    .single();
  if (practiceErr) throw practiceErr;

  const clinicianIds: Record<ClinicianKey, string> = { doc: "", np: "" };
  for (const c of CLINICIANS) {
    const { data, error } = await supabase
      .from("clinicians")
      .insert({ practice_id: practice.id, name: c.name, role: c.role, specialty: c.specialty })
      .select()
      .single();
    if (error) throw error;
    clinicianIds[c.key] = data.id;
  }

  const now = Date.now();
  const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString().slice(0, 10);
  const hoursAgoIso = (h: number) => new Date(now - h * 3600000).toISOString();

  // Defaults for the audit-trail fields (research/03 "Documentation & audit-trail requirements"):
  // most seeded patients get a fully-compliant trail so the demo shows healthy captured billing;
  // a couple of patients override these to demonstrate the "live contact happened but not yet
  // billable" pending states (see tcmMedReconDone/rpmLiveContactMinutes overrides above).
  const tcmMedReconDoneFor = (p: PatientSeed) => p.tcmMedReconDone ?? p.tcmContactDone;
  const tcmMdmLevelFor = (p: PatientSeed) => p.tcmMdmLevel ?? (p.f2fOffsetDays + p.dischargeDaysAgo <= 7 ? "high" : "moderate");
  const rpmMinutesFor = (p: PatientSeed) => (p.rpmDays >= 2 ? p.rpmLiveContactMinutes ?? 22 : null);

  for (const p of PATIENTS) {
    const { data: patient, error: patientErr } = await supabase
      .from("patients")
      .insert({
        practice_id: practice.id,
        clinician_id: clinicianIds[p.clinician],
        name: p.name,
        phone: p.phone,
        discharge_date: daysAgo(p.dischargeDaysAgo),
        condition: p.condition,
        is_demo: true,
        enrolled_at: hoursAgoIso(p.dischargeDaysAgo * 24),
        tcm_contact_done: p.tcmContactDone,
        tcm_contact_date: p.tcmContactDaysAgo != null ? daysAgo(p.tcmContactDaysAgo) : null,
        f2f_scheduled_date: daysAgo(-p.f2fOffsetDays),
        rpm_days_this_period: p.rpmDays,
        // Compliance trail: research/03's "product-defining" AI-eligibility rules require the TCM 2-day
        // contact and the RPM monthly interactive communication to be made by a human clinician via live,
        // synchronous contact — AI/automated messaging cannot satisfy either billing requirement.
        consent_captured_at: hoursAgoIso(p.dischargeDaysAgo * 24),
        tcm_contact_by: p.tcmContactDone ? clinicianIds[p.clinician] : null,
        tcm_contact_method: p.tcmContactDone ? "phone_live" : null,
        tcm_med_reconciliation_at: p.tcmContactDone && tcmMedReconDoneFor(p) ? hoursAgoIso((p.tcmContactDaysAgo ?? p.dischargeDaysAgo) * 24) : null,
        tcm_mdm_level: p.tcmContactDone ? tcmMdmLevelFor(p) : null,
        rpm_live_contact_at: p.rpmDays >= 2 ? hoursAgoIso(24) : null,
        rpm_live_contact_by: p.rpmDays >= 2 ? clinicianIds[p.clinician] : null,
        rpm_live_contact_method: p.rpmDays >= 2 ? "phone_live" : null,
        rpm_live_contact_minutes: rpmMinutesFor(p),
      })
      .select()
      .single();
    if (patientErr) throw patientErr;

    if (p.medications.length > 0) {
      const { error } = await supabase.from("medications").insert(
        p.medications.map((m) => ({
          patient_id: patient.id,
          name: m.name,
          dose: m.dose,
          frequency: m.frequency,
          status: m.status,
          reason: m.reason ?? null,
        }))
      );
      if (error) throw error;
    }

    if (p.redFlags.length > 0) {
      const { error } = await supabase.from("red_flags").insert(
        p.redFlags.map((f) => ({
          patient_id: patient.id,
          severity: f.severity,
          title: f.title,
          explanation_plain_english: f.explanation,
          source: f.source,
        }))
      );
      if (error) throw error;
    }

    const { data: latestCheckin, error: latestErr } = await supabase
      .from("checkins")
      .insert({
        patient_id: patient.id,
        called_at: hoursAgoIso(p.latestCheckin.hoursAgo),
        transcript: p.latestCheckin.transcript,
        summary: p.latestCheckin.summary,
        mood: p.latestCheckin.mood,
        proms_score: p.latestCheckin.proms,
        flags_raised: p.latestCheckin.flagsRaised ?? [],
      })
      .select()
      .single();
    if (latestErr) throw latestErr;

    const history = historicalCheckins(p);
    const { error: historyErr } = await supabase.from("checkins").insert(
      history.map((h) => ({
        patient_id: patient.id,
        called_at: new Date(now - h.daysAgo * 86400000 - 9 * 3600000).toISOString(),
        transcript: h.transcript,
        summary: h.summary,
        mood: h.mood,
        proms_score: h.proms,
        flags_raised: [],
      }))
    );
    if (historyErr) throw historyErr;

    // Insert oldest-first so the timeline chart can read a natural build-up; the alert (if any)
    // links to the most recent event, matching how the demo narrative pairs "latest signal → alert".
    let latestWearableEventId: string | null = null;
    for (const we of p.wearableEvents ?? []) {
      const { data: wearableEvent, error: weErr } = await supabase
        .from("wearable_events")
        .insert({
          patient_id: patient.id,
          device: we.device,
          event_type: we.eventType,
          detail: we.detail,
          severity: we.severity,
          detected_at: hoursAgoIso(we.detectedHoursAgo),
          triggered_checkin_id: we.linkToLatestCheckin ? latestCheckin.id : null,
        })
        .select()
        .single();
      if (weErr) throw weErr;
      latestWearableEventId = wearableEvent.id;
    }

    if (p.alert) {
      const source = p.alert.source ?? "call";
      const { error } = await supabase.from("alerts").insert({
        patient_id: patient.id,
        checkin_id: latestCheckin.id,
        severity: p.alert.severity,
        message: p.alert.message,
        clinician_id: clinicianIds[p.clinician],
        reviewed_by: p.alert.reviewed ? clinicianIds[p.clinician] : null,
        reviewed_at: p.alert.reviewed ? hoursAgoIso(p.alert.sentHoursAgo - 0.05) : null,
        action_taken: p.alert.reviewed ? p.alert.action ?? "none" : "none",
        sent_at: hoursAgoIso(p.alert.sentHoursAgo),
        source,
        wearable_event_id: source === "wearable" ? latestWearableEventId : null,
      });
      if (error) throw error;
    }

    // Demo billing rows are generated by the SAME engine real compliance actions drive
    // (lib/billing.ts#computeExpectedBilling) rather than a separately hand-picked set of
    // numbers — so clicking a compliance action on a demo patient (e.g. "+1 RPM device day")
    // reconciles to numbers consistent with what was seeded, never an unexplained jump.
    const billingRows = computeExpectedBilling(
      {
        discharge_date: daysAgo(p.dischargeDaysAgo),
        tcm_contact_done: p.tcmContactDone,
        tcm_contact_by: p.tcmContactDone ? clinicianIds[p.clinician] : null,
        tcm_contact_method: p.tcmContactDone ? "phone_live" : null,
        tcm_contact_date: p.tcmContactDaysAgo != null ? daysAgo(p.tcmContactDaysAgo) : null,
        tcm_med_reconciliation_at: p.tcmContactDone && tcmMedReconDoneFor(p) ? hoursAgoIso((p.tcmContactDaysAgo ?? p.dischargeDaysAgo) * 24) : null,
        tcm_mdm_level: p.tcmContactDone ? tcmMdmLevelFor(p) : null,
        f2f_scheduled_date: daysAgo(-p.f2fOffsetDays),
        rpm_days_this_period: p.rpmDays,
        rpm_live_contact_at: p.rpmDays >= 2 ? hoursAgoIso(24) : null,
        rpm_live_contact_by: p.rpmDays >= 2 ? clinicianIds[p.clinician] : null,
        rpm_live_contact_method: p.rpmDays >= 2 ? "phone_live" : null,
        rpm_live_contact_minutes: rpmMinutesFor(p),
      },
      new Date(now)
    );

    if (billingRows.length > 0) {
      const { error: billingErr } = await supabase.from("billing_events").insert(
        billingRows.map((b) => ({ patient_id: patient.id, ...b }))
      );
      if (billingErr) throw billingErr;
    }
  }

  revalidatePath("/doctor", "layout");
  revalidatePath("/practice");

  return { patientCount: PATIENTS.length };
}
