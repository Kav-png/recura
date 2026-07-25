"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { getDemoClinician } from "@/lib/queries";
import { SESSION_COOKIE, isValidAccessCode, sessionTokenForCode } from "@/lib/auth";
import { extractCheckin, pickPrimaryMedication, promQuestionFor, type TranscriptLine } from "@/lib/checkinExtraction";

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

export async function startCheckin(patientId: string) {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) throw new Error("ELEVENLABS_AGENT_ID is not configured");

  const supabase = supabaseServer();
  const [{ data: patient, error: pErr }, { data: medications, error: mErr }] = await Promise.all([
    supabase.from("patients").select("name, condition").eq("id", patientId).single(),
    supabase.from("medications").select("name, status").eq("patient_id", patientId),
  ]);
  if (pErr) throw pErr;
  if (mErr) throw mErr;

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
    supabase.from("patients").select("condition, clinician_id").eq("id", patientId).single(),
    supabase.from("medications").select("name, status").eq("patient_id", patientId),
  ]);
  if (pErr) throw pErr;
  if (mErr) throw mErr;

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
