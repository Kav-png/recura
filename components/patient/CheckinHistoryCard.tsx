"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { MOOD_META } from "./copy";
import { Card } from "./Card";

type Checkin = {
  id: string;
  called_at: string;
  summary: string | null;
  mood: string | null;
  proms_score: number | null;
};

// PROMs is a 0-100 clinical scale meant for the doctor dashboard's trend chart — a bare
// number means nothing reassuring to a patient, so we only ever turn it into a relative,
// worded comparison against the previous check-in, per this task's brief. The number itself
// never reaches this component's output.
function trendPhrase(current: number | null, previous: number | null): string | null {
  if (current == null || previous == null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 8) return "about the same as last time";
  return diff > 0 ? "a little better than last time" : "a little more uncomfortable than last time";
}

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", { weekday: "long", month: "short", day: "numeric" });
}

export function CheckinHistoryCard({ patientId, checkins }: { patientId: string; checkins: Checkin[] }) {
  const [liveCheckins, setLiveCheckins] = useState(checkins);

  useEffect(() => {
    setLiveCheckins(checkins);
  }, [checkins]);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`checkins:${patientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins", filter: `patient_id=eq.${patientId}` },
        (payload) => {
          const row = payload.new as Checkin;
          setLiveCheckins((prev) => (prev.some((c) => c.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);

  const ordered = [...liveCheckins].sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime());

  return (
    <Card title="Your check-ins" subtitle="How you’ve been feeling, day to day">
      {ordered.length === 0 ? (
        <p className="text-sm text-muted">No check-ins yet — your first daily call will appear here.</p>
      ) : (
        <div className="flex flex-col">
          {ordered.map((c, i) => {
            const meta = MOOD_META[c.mood ?? "okay"] ?? MOOD_META.okay;
            const previous = ordered[i + 1];
            const trend = trendPhrase(c.proms_score, previous?.proms_score ?? null);
            return (
              <div key={c.id} className="flex items-start gap-3 py-2.5 border-b border-border/60 last:border-0">
                <div className="text-2xl leading-none shrink-0 mt-0.5" aria-hidden="true">
                  {meta.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <div className="text-[14px] font-semibold">{formatDate(c.called_at)}</div>
                    <div className="text-[13px] text-muted">
                      {meta.label}
                      {trend ? ` · ${trend}` : ""}
                    </div>
                  </div>
                  {c.summary && <p className="text-[13.5px] text-foreground/70 mt-0.5 leading-snug">{c.summary}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
