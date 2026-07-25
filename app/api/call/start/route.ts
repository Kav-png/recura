import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { pickPrimaryMedication, promQuestionFor } from "@/lib/checkinExtraction";
import { emergencyNumberFor } from "@/lib/emergency";

/**
 * Triggers a real PSTN call via ElevenLabs (the patient's actual phone rings), as opposed to
 * the WebRTC demo call in CheckinCallButton which connects straight from the doctor's browser.
 * Requires ELEVENLABS_PHONE_NUMBER_ID — a phone number provisioned in the ElevenLabs dashboard
 * (Conversational AI > Phone Numbers). That provisioning step is a real-money purchase and can't
 * be done from here; this route just wires the call once a number exists.
 */
export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!agentId) return NextResponse.json({ error: "ELEVENLABS_AGENT_ID is not configured." }, { status: 500 });
    if (!apiKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY is not configured." }, { status: 500 });
    if (!phoneNumberId) {
      return NextResponse.json(
        { error: "ELEVENLABS_PHONE_NUMBER_ID is not configured — provision a number in the ElevenLabs dashboard first." },
        { status: 500 }
      );
    }

    const { patientId } = await request.json();
    if (!patientId) return NextResponse.json({ error: "patientId is required." }, { status: 400 });

    const [{ data: patient, error: pErr }, { data: medications, error: mErr }] = await Promise.all([
      supabase.from("patients").select("name, phone, condition, practices(country)").eq("id", patientId).maybeSingle(),
      supabase.from("medications").select("name, status").eq("patient_id", patientId),
    ]);
    if (pErr) throw pErr;
    if (mErr) throw mErr;
    if (!patient) return NextResponse.json({ error: "This patient no longer exists." }, { status: 404 });
    if (!patient.phone) return NextResponse.json({ error: "This patient has no phone number on file." }, { status: 400 });

    const medicationName = pickPrimaryMedication(medications ?? []);

    const callResponse = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: phoneNumberId,
        to_number: patient.phone,
        conversation_initiation_client_data: {
          dynamic_variables: {
            patient_id: patientId,
            patient_first_name: patient.name.split(" ")[0],
            condition: patient.condition,
            medication_name: medicationName,
            prom_question: promQuestionFor(patient.condition),
            emergency_number: emergencyNumberFor(patient.practices?.country),
          },
        },
      }),
    });

    if (!callResponse.ok) {
      const detail = await callResponse.text();
      return NextResponse.json({ error: `ElevenLabs call failed: ${detail.slice(0, 300)}` }, { status: 502 });
    }

    const result = await callResponse.json();
    return NextResponse.json({ conversationId: result.conversation_id ?? null });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not start the call." }, { status: 500 });
  }
}
