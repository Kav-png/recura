import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getCurrentClinician } from "@/lib/queries";
import { parseLetterImage, isSupportedLetterType } from "@/lib/letterParse";
import { generatePatientAccessCode } from "@/lib/patientAccessCode";
import { findAllergyMedicationConflicts, buildAllergyConflictRedFlags } from "@/lib/allergyCheck";
import { reconcileParsedLetterWithPatient } from "@/lib/patientReconcile";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }
    if (!isSupportedLetterType(file.type)) {
      return NextResponse.json({ error: `Unsupported file type "${file.type}" — use JPEG, PNG, GIF, WEBP, or PDF.` }, { status: 400 });
    }
    const existingPatientId = formData.get("patientId");

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseLetterImage(buffer.toString("base64"), file.type);

    const supabase = await supabaseServer();

    if (typeof existingPatientId === "string" && existingPatientId) {
      await reconcileParsedLetterWithPatient(supabase, existingPatientId, parsed);
      await logAudit("update_patient_from_letter", { patientId: existingPatientId });
      return NextResponse.json({ patientId: existingPatientId, summary: parsed.plain_english_summary });
    }

    const clinician = await getCurrentClinician();
    const now = new Date().toISOString();

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .insert({
        practice_id: clinician.practice_id,
        clinician_id: clinician.id,
        name: parsed.patient_name,
        condition: parsed.condition,
        discharge_date: parsed.discharge_date,
        resuscitation_status: parsed.resuscitation_status,
        emergency_contact_name: parsed.emergency_contact_name,
        follow_up_clinic: parsed.follow_up_clinic,
        is_demo: true,
        enrolled_at: now,
        consent_captured_at: now,
        access_code: generatePatientAccessCode(),
      })
      .select()
      .single();
    if (patientError) throw patientError;

    if (parsed.medications.length > 0) {
      const { error: medError } = await supabase.from("medications").insert(
        parsed.medications.map((m) => ({
          patient_id: patient.id,
          name: m.name,
          dose: m.dose,
          frequency: m.frequency,
          status: m.status,
          reason: m.reason,
        }))
      );
      if (medError) throw medError;
    }

    if (parsed.red_flags.length > 0) {
      const { error: flagError } = await supabase.from("red_flags").insert(
        parsed.red_flags.map((f) => ({
          patient_id: patient.id,
          severity: f.severity,
          title: f.title,
          explanation_plain_english: f.explanation_plain_english,
          source: "letter",
        }))
      );
      if (flagError) throw flagError;
    }

    if (parsed.allergies.length > 0) {
      const { error: allergyError } = await supabase.from("allergies").insert(
        parsed.allergies.map((a) => ({
          patient_id: patient.id,
          allergen: a.allergen,
          reaction: a.reaction,
          severity: a.severity,
        }))
      );
      if (allergyError) throw allergyError;
    }

    const allergyConflicts = findAllergyMedicationConflicts(parsed.medications, parsed.allergies);
    if (allergyConflicts.length > 0) {
      const { error: conflictError } = await supabase.from("red_flags").insert(
        buildAllergyConflictRedFlags(allergyConflicts).map((flag) => ({
          patient_id: patient.id,
          severity: flag.severity,
          title: flag.title,
          explanation_plain_english: flag.explanation_plain_english,
          source: "letter",
        }))
      );
      if (conflictError) throw conflictError;
    }

    return NextResponse.json({ patientId: patient.id, summary: parsed.plain_english_summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse the letter.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
