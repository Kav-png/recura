import "server-only";
import type { supabaseServer } from "@/lib/supabase/server";
import type { ParsedLetter } from "@/lib/letterParse";
import { findAllergyMedicationConflicts, buildAllergyConflictRedFlags } from "@/lib/allergyCheck";

type Supabase = Awaited<ReturnType<typeof supabaseServer>>;

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Merges a freshly-parsed discharge letter into a patient who already exists (a readmission,
 * or a clearer re-scan of the same letter) — never a destructive replace. Medications/allergies
 * already on file are updated in place when the letter names them again (dose/status can change
 * between admissions); anything the letter doesn't mention is left untouched rather than deleted,
 * and anything genuinely new is appended. Red flags always accumulate (same as call-sourced ones
 * already do) since they're a dated clinical note, not a snapshot to overwrite.
 */
export async function reconcileParsedLetterWithPatient(supabase: Supabase, patientId: string, parsed: ParsedLetter) {
  const { error: patientError } = await supabase
    .from("patients")
    .update({
      condition: parsed.condition,
      discharge_date: parsed.discharge_date,
      resuscitation_status: parsed.resuscitation_status,
      emergency_contact_name: parsed.emergency_contact_name,
      follow_up_clinic: parsed.follow_up_clinic,
    })
    .eq("id", patientId);
  if (patientError) throw patientError;

  const { data: existingMeds, error: medFetchError } = await supabase
    .from("medications")
    .select("id, name")
    .eq("patient_id", patientId);
  if (medFetchError) throw medFetchError;
  const medIdByName = new Map((existingMeds ?? []).map((m) => [normalize(m.name), m.id]));

  for (const m of parsed.medications) {
    const existingId = medIdByName.get(normalize(m.name));
    if (existingId) {
      const { error } = await supabase
        .from("medications")
        .update({ dose: m.dose, frequency: m.frequency, status: m.status, reason: m.reason })
        .eq("id", existingId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("medications")
        .insert({ patient_id: patientId, name: m.name, dose: m.dose, frequency: m.frequency, status: m.status, reason: m.reason });
      if (error) throw error;
    }
  }

  const { data: existingAllergies, error: allergyFetchError } = await supabase
    .from("allergies")
    .select("id, allergen")
    .eq("patient_id", patientId);
  if (allergyFetchError) throw allergyFetchError;
  const allergyIdByName = new Map((existingAllergies ?? []).map((a) => [normalize(a.allergen), a.id]));

  for (const a of parsed.allergies) {
    const existingId = allergyIdByName.get(normalize(a.allergen));
    if (existingId) {
      const { error } = await supabase.from("allergies").update({ reaction: a.reaction, severity: a.severity }).eq("id", existingId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("allergies")
        .insert({ patient_id: patientId, allergen: a.allergen, reaction: a.reaction, severity: a.severity });
      if (error) throw error;
    }
  }

  if (parsed.red_flags.length > 0) {
    const { error } = await supabase.from("red_flags").insert(
      parsed.red_flags.map((f) => ({
        patient_id: patientId,
        severity: f.severity,
        title: f.title,
        explanation_plain_english: f.explanation_plain_english,
        source: "letter",
      }))
    );
    if (error) throw error;
  }

  // Re-check conflicts against the full reconciled medication/allergy list (not just this
  // letter's), since a conflict can arise from an old medication + a newly-disclosed allergy
  // or vice versa. Skip any conflict whose flag is already on file so re-parsing the same
  // letter twice doesn't spam duplicate danger alerts.
  const [{ data: allMeds }, { data: allAllergies }, { data: existingFlags }] = await Promise.all([
    supabase.from("medications").select("name").eq("patient_id", patientId),
    supabase.from("allergies").select("allergen, reaction").eq("patient_id", patientId),
    supabase.from("red_flags").select("title").eq("patient_id", patientId),
  ]);
  const existingFlagTitles = new Set((existingFlags ?? []).map((f) => f.title));
  const conflicts = findAllergyMedicationConflicts(allMeds ?? [], allAllergies ?? []);
  const newConflictFlags = buildAllergyConflictRedFlags(conflicts).filter((f) => !existingFlagTitles.has(f.title));
  if (newConflictFlags.length > 0) {
    const { error } = await supabase.from("red_flags").insert(
      newConflictFlags.map((flag) => ({
        patient_id: patientId,
        severity: flag.severity,
        title: flag.title,
        explanation_plain_english: flag.explanation_plain_english,
        source: "letter",
      }))
    );
    if (error) throw error;
  }
}
