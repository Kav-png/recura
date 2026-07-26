"use client";

import { useState } from "react";
import { severityMeta, daysSince, timeAgo, type Severity } from "@/lib/status";
import { WEARABLE_EVENT_LABELS, WEARABLE_SEVERITY_COLOR } from "@/lib/wearableEvents";

type Checkin = {
  id: string;
  called_at: string;
  summary: string | null;
  mood: string | null;
  proms_score: number | null;
  transcript: unknown;
};
type WearableEvent = {
  id: string;
  device: string;
  event_type: string;
  detail: string;
  severity: string;
  detected_at: string;
  triggered_checkin_id: string | null;
};

// Short glyph per event type so markers are distinguishable without relying on color alone
// (color already carries severity). Kept to 1-2 characters so it fits inside a small circle.
const WEARABLE_EVENT_GLYPH: Record<string, string> = {
  hypertension_notification: "BP",
  irregular_rhythm_notification: "≈",
  high_heart_rate: "↑",
  low_heart_rate: "↓",
  fall_detected: "!",
};

type Selection = { kind: "checkin"; checkin: Checkin } | { kind: "wearable"; event: WearableEvent };

// Plots PROMs alongside discrete wearable notifications on one real (day-since-discharge)
// timeline, so the clinician can see whether device signals and symptom trend move together —
// per MASTER-PLAN.md, markers are discrete pre-classified events, never a continuous HR/HRV/BP
// waveform. Clickable (not just hover) so it's usable on a bedside tablet, not just desktop.
export function TrendChart({
  checkins,
  wearableEvents,
  dischargeDate,
}: {
  checkins: Checkin[];
  wearableEvents: WearableEvent[];
  dischargeDate: string;
}) {
  const scored = [...checkins]
    .filter((c) => c.proms_score != null)
    .sort((a, b) => new Date(a.called_at).getTime() - new Date(b.called_at).getTime());
  const sortedEvents = [...wearableEvents].sort((a, b) => new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime());

  const mostRecent: Selection | null = (() => {
    const lastCheckin = scored[scored.length - 1];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    if (!lastCheckin && !lastEvent) return null;
    if (!lastEvent) return { kind: "checkin", checkin: lastCheckin };
    if (!lastCheckin) return { kind: "wearable", event: lastEvent };
    return new Date(lastEvent.detected_at) > new Date(lastCheckin.called_at)
      ? { kind: "wearable", event: lastEvent }
      : { kind: "checkin", checkin: lastCheckin };
  })();

  const [selected, setSelected] = useState<Selection | null>(mostRecent);

  if (scored.length < 2 && wearableEvents.length === 0) return null;

  const w = 720;
  const h = 220;
  const leftGutter = 30;
  const rightPad = 10;
  const bottomGutter = 22;
  const topPad = 24;
  const bottomPad = 8;
  const max = 100;
  const plotTop = topPad;
  const plotBottom = h - bottomGutter - bottomPad;

  const dischargeMs = new Date(dischargeDate).getTime();
  const totalDays = Math.max(1, daysSince(dischargeDate));
  const dayOffset = (iso: string) => (new Date(iso).getTime() - dischargeMs) / 86400000;
  const xForDay = (day: number) =>
    leftGutter + (Math.min(Math.max(day, 0), totalDays) / totalDays) * (w - leftGutter - rightPad);
  const yForScore = (score: number) => plotBottom - (score / max) * (plotBottom - plotTop);

  const promsPoints = scored.map((c) => ({
    x: xForDay(dayOffset(c.called_at)),
    y: yForScore(c.proms_score!),
    checkin: c,
  }));
  const polyline = promsPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const last = scored[scored.length - 1];

  // Day tick marks: discharge, then every 7 days, plus "today" if it doesn't collide.
  const dayTicks = [0];
  for (let d = 7; d < totalDays; d += 7) dayTicks.push(d);
  if (totalDays - (dayTicks[dayTicks.length - 1] ?? 0) > 3) dayTicks.push(totalDays);

  return (
    <div className="surface rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="font-heading font-bold text-[15px]">PROMs &amp; Wearable Signals &middot; Since Discharge</div>
        <div className="text-xs text-muted">Tap a point for details</div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-[11.5px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-[3px] rounded-full bg-primary" /> PROMs (patient-reported symptom score)
        </span>
        {(["info", "warn", "danger"] as Severity[]).map((sev) => (
          <span key={sev} className="flex items-center gap-1.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${severityMeta[sev].dot}`} />
            {severityMeta[sev].label} device notification
          </span>
        ))}
      </div>

      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="block">
        {/* Reference bands — visual scanning aid only, not a diagnostic threshold */}
        <rect x={leftGutter} y={yForScore(100)} width={w - leftGutter - rightPad} height={yForScore(66) - yForScore(100)} fill="var(--stable)" opacity="0.06" />
        <rect x={leftGutter} y={yForScore(66)} width={w - leftGutter - rightPad} height={yForScore(33) - yForScore(66)} fill="var(--warning)" opacity="0.06" />
        <rect x={leftGutter} y={yForScore(33)} width={w - leftGutter - rightPad} height={yForScore(0) - yForScore(33)} fill="var(--critical)" opacity="0.07" />

        {[0, 50, 100].map((score) => (
          <g key={score}>
            <line x1={leftGutter} y1={yForScore(score)} x2={w - rightPad} y2={yForScore(score)} stroke="var(--border)" strokeWidth="1" />
            <text x={leftGutter - 6} y={yForScore(score) + 3} textAnchor="end" fontSize="9.5" fill="var(--muted)">
              {score}
            </text>
          </g>
        ))}

        {dayTicks.map((d) => (
          <g key={d}>
            <line x1={xForDay(d)} y1={plotTop} x2={xForDay(d)} y2={plotBottom} stroke="var(--border)" strokeWidth="1" opacity="0.4" />
            <text x={xForDay(d)} y={h - 6} textAnchor="middle" fontSize="9.5" fill="var(--muted)">
              {d === 0 ? "Discharge" : d === totalDays ? "Today" : `Day ${d}`}
            </text>
          </g>
        ))}

        {promsPoints.length > 1 && (
          <polyline points={polyline} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {promsPoints.map((p, i) => {
          const isSelected = selected?.kind === "checkin" && selected.checkin.id === p.checkin.id;
          return (
            <g key={p.checkin.id} onClick={() => setSelected({ kind: "checkin", checkin: p.checkin })} className="cursor-pointer">
              <circle cx={p.x} cy={p.y} r="11" fill="transparent" />
              <circle
                cx={p.x}
                cy={p.y}
                r={isSelected ? 7 : i === promsPoints.length - 1 ? 5 : 3.5}
                fill="var(--primary)"
                stroke={isSelected ? "var(--surface)" : "none"}
                strokeWidth={isSelected ? 2 : 0}
              >
                <title>{`Check-in ${timeAgo(p.checkin.called_at)} — PROMs ${p.checkin.proms_score}`}</title>
              </circle>
            </g>
          );
        })}

        {sortedEvents.map((we) => {
          const x = xForDay(dayOffset(we.detected_at));
          const color = WEARABLE_SEVERITY_COLOR[we.severity] ?? "var(--muted)";
          const isSelected = selected?.kind === "wearable" && selected.event.id === we.id;
          const r = isSelected ? 10 : 7.5;
          return (
            <g key={we.id} onClick={() => setSelected({ kind: "wearable", event: we })} className="cursor-pointer">
              <line x1={x} y1={plotTop} x2={x} y2={plotBottom} stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
              <circle cx={x} cy={topPad - 8} r="13" fill="transparent" />
              <circle cx={x} cy={topPad - 8} r={r} fill={color} stroke={isSelected ? "var(--surface)" : "none"} strokeWidth={isSelected ? 2 : 0}>
                <title>{`${WEARABLE_EVENT_LABELS[we.event_type] ?? we.event_type} — ${timeAgo(we.detected_at)}`}</title>
              </circle>
              <text x={x} y={topPad - 8} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="700" fill="white" className="pointer-events-none select-none">
                {WEARABLE_EVENT_GLYPH[we.event_type] ?? "?"}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Detail panel — persistent (not hover-only) so it works on a bedside tablet */}
      <div className="mt-2 pt-3 border-t border-black/10 min-h-[64px]">
        {!selected && <div className="text-xs text-muted">No PROMs check-ins or device notifications yet.</div>}
        {selected?.kind === "checkin" && (
          <div>
            <div className="flex items-center gap-2 text-[13px] font-bold">
              Check-in &middot; {timeAgo(selected.checkin.called_at)}
              <span className="text-[11px] font-semibold text-muted">PROMs {selected.checkin.proms_score}/100</span>
            </div>
            <div className="text-[12.5px] text-foreground/70 mt-1 leading-snug">
              {selected.checkin.mood ? <>Felt {selected.checkin.mood}. </> : null}
              {selected.checkin.summary ?? "No summary recorded."}
            </div>
          </div>
        )}
        {selected?.kind === "wearable" &&
          (() => {
            const meta = severityMeta[selected.event.severity as Severity];
            const linkedCheckin = selected.event.triggered_checkin_id
              ? checkins.find((c) => c.id === selected.event.triggered_checkin_id)
              : null;
            return (
              <div>
                <div className="flex items-center gap-2 flex-wrap text-[13px] font-bold">
                  {WEARABLE_EVENT_LABELS[selected.event.event_type] ?? selected.event.event_type}
                  <span className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${meta.bg} ${meta.text}`}>{meta.label}</span>
                  <span className="text-[11px] font-normal text-muted">{timeAgo(selected.event.detected_at)}</span>
                </div>
                <div className="text-[12.5px] text-foreground/70 mt-1 leading-snug">{selected.event.detail}</div>
                <div className="text-[11px] text-muted mt-1">{selected.event.device}</div>
                {linkedCheckin ? (
                  <div className="mt-2 pt-2 border-t border-black/10 text-[12px]">
                    <span className="font-semibold">Follow-up call</span> ({timeAgo(linkedCheckin.called_at)}, PROMs{" "}
                    {linkedCheckin.proms_score ?? "—"}, felt {linkedCheckin.mood ?? "unknown"}): &ldquo;{linkedCheckin.summary}&rdquo;
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-black/10 text-[12px] font-semibold">No follow-up call yet.</div>
                )}
              </div>
            );
          })()}
      </div>
      <div className="text-xs text-muted mt-2">
        {last ? <>Latest PROMs: {last.proms_score} on {timeAgo(last.called_at)}</> : "No PROMs check-ins yet."}
      </div>
    </div>
  );
}
