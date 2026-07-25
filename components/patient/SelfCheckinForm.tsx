"use client";

import { useState, useTransition } from "react";
import { submitSelfCheckin } from "@/app/patient/actions";
import { SELF_CHECKIN_MOODS } from "./copy";
import { Card } from "./Card";

export function SelfCheckinForm({ patientId }: { patientId: string }) {
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Card>
        <div className="text-center py-3">
          <div className="text-3xl mb-2" aria-hidden="true">
            ✅
          </div>
          <div className="font-heading font-bold text-[16px]">Thanks — that&rsquo;s been noted</div>
          <p className="text-[13.5px] text-muted mt-1">Your care team can see this at your next review.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="How am I doing today?" subtitle="A quick note between your daily calls — this isn&rsquo;t monitored in real time.">
      <div className="flex gap-2 flex-wrap">
        {SELF_CHECKIN_MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMood(m.value)}
            className={`flex-1 min-w-[70px] flex flex-col items-center gap-1 py-3.5 rounded-2xl border-2 transition-colors ${
              mood === m.value ? "border-primary bg-primary/10" : "border-border bg-muted-bg/50"
            }`}
          >
            <span className="text-2xl" aria-hidden="true">
              {m.emoji}
            </span>
            <span className="text-[12.5px] font-semibold">{m.label}</span>
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Anything you'd like your care team to know? (optional)"
        rows={3}
        className="w-full mt-3.5 rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <button
        type="button"
        disabled={!mood || isPending}
        onClick={() =>
          startTransition(async () => {
            await submitSelfCheckin(patientId, mood!, note);
            setDone(true);
          })
        }
        className="w-full mt-3.5 py-3.5 rounded-2xl bg-primary text-white font-heading font-bold text-[15px] disabled:opacity-40"
      >
        {isPending ? "Sending…" : "Share how I'm feeling"}
      </button>
      <p className="text-[12px] text-muted mt-2.5 leading-relaxed">
        If you feel seriously unwell right now, please call 999 or your GP straightaway rather than using this form.
      </p>
    </Card>
  );
}
