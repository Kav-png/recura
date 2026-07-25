"use server";

import { supabaseServiceRole } from "@/lib/supabase/serviceRole";
import { revalidatePath } from "next/cache";

/**
 * Real (non-demo) practice/clinician/patient enrollment — deliberately a
 * separate code path from lib/demoData.ts's reloadDemoData(). Nothing here
 * ever deletes or resets anything; reloadDemoData() never touches is_demo=false
 * rows. Uses the service-role client because these rows are not readable/
 * writable by the anon key under RLS (see the anon_demo_* policies).
 *
 * This is enrollment infrastructure only — see CLAUDE.md's "no real patient
 * data" rail and research/10-ml-model-governance.md before actually using it
 * against a real person.
 */

export type RealPracticeInput = {
  practiceName: string;
  clinicianName: string;
  clinicianRole: "physician" | "nurse";
  specialty?: string;
};

export async function createRealPractice(input: RealPracticeInput) {
  const supabase = supabaseServiceRole();

  const { data: practice, error: practiceErr } = await supabase
    .from("practices")
    .insert({ name: input.practiceName, is_demo: false })
    .select()
    .single();
  if (practiceErr) throw practiceErr;

  const { data: clinician, error: clinicianErr } = await supabase
    .from("clinicians")
    .insert({
      practice_id: practice.id,
      name: input.clinicianName,
      role: input.clinicianRole,
      specialty: input.specialty ?? null,
    })
    .select()
    .single();
  if (clinicianErr) throw clinicianErr;

  revalidatePath("/settings");
  return { practice, clinician };
}

export type RealPatientInput = {
  practiceId: string;
  clinicianId: string;
  name: string;
  phone: string;
  condition: "HF" | "COPD";
  dischargeDate: string;
  consentGranted: boolean;
};

export async function enrollPatient(input: RealPatientInput) {
  if (!input.consentGranted) {
    throw new Error(
      "Cannot enroll a real patient without consent captured at enrollment (TCPA — research/06-regulatory-compliance.md)."
    );
  }

  const supabase = supabaseServiceRole();

  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      practice_id: input.practiceId,
      clinician_id: input.clinicianId,
      name: input.name,
      phone: input.phone,
      condition: input.condition,
      discharge_date: input.dischargeDate,
      is_demo: false,
      consent_captured_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  revalidatePath("/settings");
  return patient;
}

export async function listRealPractices() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];

  const supabase = supabaseServiceRole();
  const { data, error } = await supabase
    .from("practices")
    .select("*, clinicians(*)")
    .eq("is_demo", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
