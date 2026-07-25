"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

const VALID_MOODS = new Set(["good", "okay", "tired", "distressed"]);

// Secondary check-in path per MASTER-PLAN.md — voice call remains primary. Deliberately does
// not run the severity/PROMs extraction that the voice pipeline uses (lib/checkinExtraction.ts,
// out of scope here): we only record what the patient actually said, we don't score or
// diagnose it. No proms_score, no auto-generated alert — inventing either would break
// CLAUDE.md's "never diagnoses, prescribes, or reassures about symptoms" rail.
export async function submitSelfCheckin(patientId: string, mood: string, note: string) {
  const supabase = supabaseServer();
  const safeMood = VALID_MOODS.has(mood) ? mood : "okay";
  const trimmedNote = note.trim();

  const { error } = await supabase.from("checkins").insert({
    patient_id: patientId,
    called_at: new Date().toISOString(),
    mood: safeMood,
    summary: trimmedNote.length > 0 ? trimmedNote : "Shared a self check-in with no additional notes.",
  });
  if (error) throw error;

  revalidatePath(`/patient/${patientId}`);
  revalidatePath("/doctor", "layout");
}
