"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Conversation } from "@elevenlabs/client";
import { Loader2, Phone, PhoneOff } from "lucide-react";
import { startCheckin, saveCheckin } from "@/lib/actions";
import type { TranscriptLine } from "@/lib/checkinExtraction";

type CallStatus = "idle" | "connecting" | "connected" | "saving" | "error";
type CallPhase = "listening" | "thinking" | "speaking";

const PHASE_LABEL: Record<CallPhase, string> = {
  listening: "Listening...",
  thinking: "Got it — thinking...",
  speaking: "Speaking",
};

export function CheckinCallButton({
  patientId,
  patientName,
  patientPhone,
}: {
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<CallStatus>("idle");
  const [phase, setPhase] = useState<CallPhase>("listening");
  const [micLevel, setMicLevel] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<Conversation | null>(null);

  const [realCallStatus, setRealCallStatus] = useState<"idle" | "dialing" | "dialed" | "error">("idle");
  const [realCallError, setRealCallError] = useState<string | null>(null);

  async function handleRealCall() {
    setRealCallStatus("dialing");
    setRealCallError(null);
    try {
      const res = await fetch("/api/call/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not start the call.");
      setRealCallStatus("dialed");
    } catch (err) {
      setRealCallError(err instanceof Error ? err.message : "Could not start the call.");
      setRealCallStatus("error");
    }
  }

  async function handleStart() {
    setError(null);
    setTranscript([]);
    setStatus("connecting");
    try {
      const { agentId, dynamicVariables } = await startCheckin(patientId);
      const conversation = await Conversation.startSession({
        agentId,
        dynamicVariables,
        connectionType: "webrtc",
        onConnect: () => {
          setPhase("listening");
          setStatus("connected");
        },
        onMessage: ({ message, role }) => {
          setTranscript((prev) => [...prev, { speaker: role === "agent" ? "agent" : "patient", text: message }]);
        },
        // The agent SDK reports listening/speaking directly; "thinking" is the gap in between,
        // signaled separately by onAgentTyping once it's done transcribing and started composing.
        onModeChange: ({ mode }) => setPhase(mode === "speaking" ? "speaking" : "listening"),
        onAgentTyping: ({ is_typing }) => {
          if (is_typing) setPhase("thinking");
        },
        onVadScore: ({ vadScore }) => setMicLevel(vadScore),
        onDisconnect: () => setStatus((s) => (s === "error" ? s : "idle")),
        onError: (message) => {
          setError(message);
          setStatus("error");
        },
      });
      conversationRef.current = conversation;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the call.");
      setStatus("error");
    }
  }

  async function handleEnd() {
    const conversation = conversationRef.current;
    conversationRef.current = null;
    if (conversation) await conversation.endSession();

    if (transcript.length === 0) {
      setStatus("idle");
      return;
    }

    setStatus("saving");
    try {
      await saveCheckin(patientId, transcript);
      router.refresh();
      setStatus("idle");
      setTranscript([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the check-in.");
      setStatus("error");
    }
  }

  const isOpen = status !== "idle";

  return (
    <>
      <button
        onClick={handleStart}
        disabled={status === "connecting" || status === "connected"}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-[10px] bg-primary text-white disabled:opacity-50 shrink-0"
      >
        <Phone size={14} />
        Start check-in call
      </button>

      {patientPhone && (
        <div className="flex flex-col items-start sm:items-end gap-1">
          <button
            onClick={handleRealCall}
            disabled={realCallStatus === "dialing"}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-[10px] bg-muted-bg disabled:opacity-50 shrink-0"
          >
            {realCallStatus === "dialing" ? <Loader2 size={14} className="animate-spin" /> : <Phone size={14} />}
            {realCallStatus === "dialing" ? "Dialing..." : "Call real phone"}
          </button>
          {realCallStatus === "dialed" && (
            <div className="text-[11.5px] text-muted max-w-[220px] text-right">
              Calling {patientPhone} — the transcript will land here automatically once the call ends.
            </div>
          )}
          {realCallStatus === "error" && realCallError && (
            <div className="text-[11.5px] text-critical max-w-[220px] text-right">{realCallError}</div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="surface-strong rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-heading font-bold text-[15px]">Check-in call &middot; {patientName}</div>
                <div className="text-xs text-muted mt-0.5">
                  {status === "connecting" && "Connecting..."}
                  {status === "connected" && PHASE_LABEL[phase]}
                  {status === "saving" && "Saving transcript..."}
                  {status === "error" && "Something went wrong"}
                </div>
              </div>
              {status === "connected" && (
                <div className="flex items-center gap-2 shrink-0">
                  {phase === "listening" && (
                    <div className="flex items-end gap-0.5 h-3" title="Mic input level">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1 rounded-sm bg-primary transition-all duration-100"
                          style={{ height: `${Math.max(20, Math.min(100, micLevel * 100 - i * 15))}%` }}
                        />
                      ))}
                    </div>
                  )}
                  <div className="w-2 h-2 rounded-full bg-critical animate-pulse" />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1.5">
              {transcript.length === 0 && status === "connecting" && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 size={14} className="animate-spin" /> Waiting for the agent...
                </div>
              )}
              {transcript.map((line, i) => (
                <div
                  key={i}
                  className={`text-[13px] max-w-[85%] px-3 py-1.5 rounded-lg ${
                    line.speaker === "agent" ? "bg-muted-bg self-start" : "bg-primary/15 self-end ml-auto"
                  }`}
                >
                  {line.text}
                </div>
              ))}
              {error && <div className="text-[12.5px] text-critical mt-2">{error}</div>}
            </div>

            <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
              {status === "error" ? (
                <button
                  onClick={() => setStatus("idle")}
                  className="text-[12.5px] font-semibold px-3.5 py-2 rounded-[10px] bg-muted-bg"
                >
                  Close
                </button>
              ) : (
                <button
                  onClick={handleEnd}
                  disabled={status === "connecting" || status === "saving"}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[10px] bg-critical text-white disabled:opacity-50"
                >
                  <PhoneOff size={14} />
                  {status === "saving" ? "Saving..." : "End call"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
