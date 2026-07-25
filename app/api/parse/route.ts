import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getDemoClinician } from "@/lib/queries";
import { parseLetterImage, isSupportedImageType } from "@/lib/letterParse";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image was uploaded." }, { status: 400 });
    }
    if (!isSupportedImageType(file.type)) {
      return NextResponse.json({ error: `Unsupported image type "${file.type}" — use JPEG, PNG, GIF, or WEBP.` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseLetterImage(buffer.toString("base64"), file.type);

    const clinician = await getDemoClinician();
    const supabase = supabaseServer();
    const now = new Date().toISOString();

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .insert({
        practice_id: clinician.practice_id,
        clinician_id: clinician.id,
        name: parsed.patient_name,
        condition: parsed.condition,
        discharge_date: parsed.discharge_date,
        is_demo: true,
        enrolled_at: now,
        consent_captured_at: now,
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

    return NextResponse.json({ patientId: patient.id, summary: parsed.plain_english_summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse the letter.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
