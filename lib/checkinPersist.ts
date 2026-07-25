import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { extractCheckin, pickPrimaryMedication, type TranscriptLine } from "@/lib/checkinExtraction";
import { emergencyNumberFor } from "@/lib/emergency";

/**
 * Shared by the browser-call server action and the real-call webhook — both end up with a
 * patientId + transcript, just from different call paths, and must extract/store identically.
 */
export async function persistCheckin(
  supabase: SupabaseClient<Database>,
  patientId: string,
  transcript: TranscriptLine[]
) {
  const [{ data: patient, error: pErr }, { data: medications, error: mErr }] = await Promise.all([
    supabase
      .from("patients")
      .select("condition, clinician_id, practices(country)")
      .eq("id", patientId)
      .maybeSingle(),
    supabase.from("medications").select("name, status").eq("patient_id", patientId),
  ]);
  if (pErr) throw pErr;
  if (mErr) throw mErr;
  if (!patient) throw new Error("This patient no longer exists — the page may be out of date, try reloading.");

  const medicationName = pickPrimaryMedication(medications ?? []);
  const emergencyNumber = emergencyNumberFor(patient.practices?.country);
  const result = extractCheckin({ condition: patient.condition, medicationName, transcript, emergencyNumber });

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

  return { checkinId: checkin.id, severity: result.severity };
}
