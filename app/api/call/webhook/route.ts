import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseServiceRole } from "@/lib/supabase/serviceRole";
import { persistCheckin } from "@/lib/checkinPersist";
import { verifyElevenLabsSignature } from "@/lib/elevenlabsWebhook";
import type { TranscriptLine } from "@/lib/checkinExtraction";

type ElevenLabsTranscriptTurn = { role: "agent" | "user"; message: string | null };

export async function POST(request: Request) {
  try {
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
    if (!secret) return NextResponse.json({ error: "ELEVENLABS_WEBHOOK_SECRET is not configured." }, { status: 500 });

    const rawBody = await request.text();
    const signature = request.headers.get("elevenlabs-signature");
    if (!verifyElevenLabsSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    if (payload.type !== "post_call_transcription") {
      return NextResponse.json({ ok: true, skipped: payload.type });
    }

    const data = payload.data;
    const patientId: string | undefined = data?.conversation_initiation_client_data?.dynamic_variables?.patient_id;
    if (!patientId) {
      return NextResponse.json({ error: "No patient_id in conversation_initiation_client_data." }, { status: 400 });
    }

    const transcript: TranscriptLine[] = (data.transcript ?? [])
      .filter((turn: ElevenLabsTranscriptTurn) => turn.message)
      .map((turn: ElevenLabsTranscriptTurn) => ({
        speaker: turn.role === "agent" ? "agent" : "patient",
        text: turn.message as string,
      }));

    const supabase = supabaseServiceRole();
    const result = await persistCheckin(supabase, patientId, transcript);
    revalidatePath("/doctor", "layout");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not process webhook." }, { status: 500 });
  }
}
