import { WEARABLE_EVENT_LABELS } from "@/lib/wearableEvents";
import { Card } from "./Card";

type WearableEvent = {
  id: string;
  device: string;
  event_type: string;
  severity: string;
  detected_at: string;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", { weekday: "long", month: "short", day: "numeric" });
}

// Reflects the same notification the patient's own watch already surfaced to them — not a new
// clinical read of raw vitals — so this stays inside CLAUDE.md's "notices, doesn't diagnose"
// rail. No raw HR/HRV/BP numbers here, same discrete-event-only rule as the doctor dashboard.
export function WearableSignalsCard({ events }: { events: WearableEvent[] }) {
  if (events.length === 0) return null;
  const ordered = [...events].sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());

  return (
    <Card title="Your watch signals" subtitle="Notifications from your device, shared with your care team">
      <div className="flex flex-col gap-2.5">
        {ordered.map((e) => {
          const isDanger = e.severity === "danger";
          return (
            <div key={e.id} className={`rounded-2xl px-4 py-3 ${isDanger ? "bg-critical-bg" : "bg-muted-bg/70"}`}>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div className={`font-heading font-bold text-[14px] ${isDanger ? "text-critical" : ""}`}>
                  {WEARABLE_EVENT_LABELS[e.event_type] ?? e.event_type}
                </div>
                <div className="text-[12.5px] text-muted">{formatDate(e.detected_at)}</div>
              </div>
              <p className="text-[13px] text-foreground/70 mt-1">{e.device}</p>
            </div>
          );
        })}
      </div>
      <p className="text-[12px] text-muted mt-3 leading-relaxed">
        These are one-off notifications from your watch, not a continuous reading — check with your pharmacist or GP if anything feels wrong.
      </p>
    </Card>
  );
}
