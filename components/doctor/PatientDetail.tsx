import { severityMeta, daysSince, timeAgo, type Severity } from "@/lib/status";
import { CheckinCallButton } from "@/components/doctor/CheckinCallButton";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  discharge_date: string;
  condition: string;
  tcm_contact_done: boolean;
  tcm_contact_date: string | null;
  f2f_scheduled_date: string | null;
  rpm_days_this_period: number;
  clinicians: { name: string; role: string } | null;
};

type Medication = { id: string; name: string; dose: string | null; frequency: string | null; status: string; reason: string | null };
type RedFlag = { id: string; severity: string; title: string; explanation_plain_english: string; source: string };
type Checkin = {
  id: string;
  called_at: string;
  summary: string | null;
  mood: string | null;
  proms_score: number | null;
  transcript: unknown;
};
type Alert = { id: string; severity: string; message: string; sent_at: string; reviewed_at: string | null; action_taken: string | null };
type BillingEvent = { id: string; code: string; amount: number; status: string };
type WearableEvent = {
  id: string;
  device: string;
  event_type: string;
  detail: string;
  severity: string;
  detected_at: string;
  triggered_checkin_id: string | null;
};

const CODE_LABELS: Record<string, string> = {
  "99495": "TCM — moderate complexity (2-day contact)",
  "99496": "TCM — high complexity (2-day contact)",
  "99445": "RPM device supply (2–15 days data)",
  "99470": "RPM management, first 10 min",
};

const WEARABLE_EVENT_LABELS: Record<string, string> = {
  hypertension_notification: "Hypertension Notification",
  irregular_rhythm_notification: "Irregular Rhythm Notification",
  high_heart_rate: "High Heart Rate",
  low_heart_rate: "Low Heart Rate",
  fall_detected: "Fall Detected",
};

const medStatusColor: Record<string, string> = {
  new: "bg-primary",
  changed: "bg-warning",
  stopped: "bg-critical",
  unchanged: "bg-stable",
};

function TrendChart({ checkins }: { checkins: Checkin[] }) {
  const scored = checkins.filter((c) => c.proms_score != null);
  if (scored.length < 2) return null;
  const w = 720;
  const h = 160;
  const pad = 12;
  const max = 100;
  const points = scored
    .map((c, i) => {
      const x = (i / (scored.length - 1)) * (w - pad * 2) + pad;
      const y = h - pad - ((c.proms_score! / max) * (h - pad * 2));
      return `${x},${y}`;
    })
    .join(" ");
  const last = scored[scored.length - 1];

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3.5">
        <div className="font-heading font-bold text-[15px]">PROMs Score &middot; Since Discharge</div>
        <div className="text-xs text-muted hidden sm:block">Lower = more symptomatic</div>
      </div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="block">
        <line x1="0" y1={h * 0.25} x2={w} y2={h * 0.25} stroke="var(--border)" strokeWidth="1" />
        <line x1="0" y1={h * 0.5} x2={w} y2={h * 0.5} stroke="var(--border)" strokeWidth="1" />
        <line x1="0" y1={h * 0.75} x2={w} y2={h * 0.75} stroke="var(--border)" strokeWidth="1" />
        <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={points.split(" ").pop()?.split(",")[0]} cy={points.split(" ").pop()?.split(",")[1]} r="5" fill="var(--primary)" />
      </svg>
      <div className="text-xs text-muted mt-1">Latest: {last.proms_score} on {timeAgo(last.called_at)}</div>
    </div>
  );
}

export function PatientDetail({
  patient,
  medications,
  redFlags,
  checkins,
  alerts,
  billing,
  wearableEvents,
}: {
  patient: Patient;
  medications: Medication[];
  redFlags: RedFlag[];
  checkins: Checkin[];
  alerts: Alert[];
  billing: BillingEvent[];
  wearableEvents: WearableEvent[];
}) {
  const worstAlert = alerts.filter((a) => !a.reviewed_at).sort((a, b) => {
    const rank: Record<string, number> = { danger: 3, warn: 2, info: 1 };
    return rank[b.severity] - rank[a.severity];
  })[0];
  const statusSeverity: Severity = (worstAlert?.severity as Severity) ?? "stable";
  const statusMeta = severityMeta[statusSeverity];
  const orderedCheckins = [...checkins].sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime());
  const latest = orderedCheckins[0];

  return (
    <div className="flex flex-col gap-4 sm:gap-5 min-w-0">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-border px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/70 flex items-center justify-center font-heading font-bold text-white text-base sm:text-lg shrink-0">
            {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="font-heading font-extrabold text-[17px] sm:text-[19px]">{patient.name}</div>
            <div className="text-[12.5px] sm:text-[13px] text-muted mt-0.5">
              {patient.condition} &middot; Day {daysSince(patient.discharge_date)} post-discharge &middot; Discharged{" "}
              {new Date(patient.discharge_date).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
              {patient.clinicians ? <> &middot; {patient.clinicians.name}</> : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className={`px-3.5 sm:px-4 py-2 rounded-[10px] text-[12.5px] sm:text-[13px] font-semibold ${statusMeta.bg} ${statusMeta.text}`}>
            {statusMeta.label}
            {worstAlert ? ` · ${worstAlert.message}` : " · No unreviewed alerts"}
          </div>
          <CheckinCallButton patientId={patient.id} patientName={patient.name} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Latest PROMs" value={latest?.proms_score ?? "—"} unit="/ 100" color={statusMeta.dot} />
        <StatCard label="Days post-discharge" value={daysSince(patient.discharge_date)} unit="days" color="bg-stable" />
        <StatCard
          label="TCM 2-day contact"
          value={patient.tcm_contact_done ? "Done" : "Pending"}
          unit=""
          color={patient.tcm_contact_done ? "bg-stable" : "bg-warning"}
        />
        <StatCard label="RPM days this period" value={patient.rpm_days_this_period} unit="/ 30" color="bg-stable" />
      </div>

      <TrendChart checkins={orderedCheckins} />

      {/* Red flags */}
      {redFlags.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
          <div className="font-heading font-bold text-[15px] mb-3.5">Red Flags</div>
          <div className="flex flex-col gap-2.5">
            {redFlags.map((f) => {
              const meta = severityMeta[f.severity as Severity];
              return (
                <div key={f.id} className={`p-3 rounded-xl ${meta.bg}`}>
                  <div className="text-[13px] font-bold">{f.title}</div>
                  <div className="text-[12.5px] text-foreground/70 mt-0.5 leading-snug">{f.explanation_plain_english}</div>
                  <div className="text-[11px] text-muted mt-1 capitalize">Source: {f.source}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wearable signals */}
      {wearableEvents.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3.5">
            <div className="font-heading font-bold text-[15px]">Wearable Signals</div>
            <div className="text-xs text-muted hidden sm:block">Discrete device notifications, not continuous monitoring</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {wearableEvents.map((w) => {
              const meta = severityMeta[w.severity as Severity];
              const linkedCheckin = w.triggered_checkin_id ? checkins.find((c) => c.id === w.triggered_checkin_id) : null;
              return (
                <div key={w.id} className={`p-3 rounded-xl ${meta.bg}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13px] font-bold">{WEARABLE_EVENT_LABELS[w.event_type] ?? w.event_type}</div>
                    <div className="text-[11px] text-muted shrink-0">{timeAgo(w.detected_at)}</div>
                  </div>
                  <div className="text-[12.5px] text-foreground/70 mt-0.5 leading-snug">{w.detail}</div>
                  <div className="text-[11px] text-muted mt-1">{w.device}</div>
                  {linkedCheckin ? (
                    <div className="mt-2 pt-2 border-t border-black/10 text-[12px]">
                      <span className="font-semibold">Follow-up call</span> ({timeAgo(linkedCheckin.called_at)}, PROMs {linkedCheckin.proms_score ?? "—"}, felt {linkedCheckin.mood ?? "unknown"}): &ldquo;{linkedCheckin.summary}&rdquo; — see full transcript in Check-in History below.
                    </div>
                  ) : (
                    <div className="mt-2 pt-2 border-t border-black/10 text-[12px] font-semibold">No follow-up call yet.</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Medications */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
        <div className="font-heading font-bold text-[15px] mb-3">Active Medications</div>
        <div className="flex flex-col">
          {medications.map((m) => (
            <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2.5 border-b border-border/60 last:border-0">
              <div className="flex items-center gap-2.5 min-w-0 sm:flex-1">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${medStatusColor[m.status]}`} />
                <div className="text-sm font-semibold">{m.name}</div>
              </div>
              <div className="flex items-center gap-3 text-[13px] text-muted shrink-0 pl-4 sm:pl-0">
                <span className="capitalize">{m.status}</span>
                <span>{m.dose}</span>
                <span className="sm:w-[110px] sm:text-right">{m.frequency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Check-ins & transcripts */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
        <div className="font-heading font-bold text-[15px] mb-3">Check-in History &middot; Call Transcripts &amp; PROMs</div>
        <div className="flex flex-col gap-2">
          {orderedCheckins.map((c) => (
            <details key={c.id} className="rounded-xl border border-border/70 open:bg-muted-bg/50">
              <summary className="px-3 sm:px-3.5 py-3 cursor-pointer flex items-center justify-between gap-2 sm:gap-3 list-none">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="text-[13px] font-semibold shrink-0">{timeAgo(c.called_at)}</div>
                  <div className="text-[12.5px] text-muted truncate">{c.summary}</div>
                </div>
                <div className="text-[12px] font-bold text-muted shrink-0 bg-muted-bg px-2 py-0.5 rounded-full">
                  PROMs {c.proms_score ?? "—"}
                </div>
              </summary>
              <div className="px-3 sm:px-3.5 pb-3.5 pt-1 flex flex-col gap-1.5">
                {Array.isArray(c.transcript) && c.transcript.length > 0 ? (
                  (c.transcript as { speaker: string; text: string }[]).map((line, i) => (
                    <div
                      key={i}
                      className={`text-[13px] max-w-[92%] sm:max-w-[85%] px-3 py-1.5 rounded-lg ${
                        line.speaker === "agent" ? "bg-muted-bg self-start" : "bg-primary/15 self-end ml-auto"
                      }`}
                    >
                      {line.text}
                    </div>
                  ))
                ) : (
                  <div className="text-[12.5px] text-muted">No transcript recorded.</div>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Billing status */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
        <div className="font-heading font-bold text-[15px] mb-3">Episode Billing Status</div>
        <div className="flex flex-col">
          {billing.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-2.5 border-b border-border/60 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{CODE_LABELS[b.code] ?? b.code}</div>
                <div className="text-xs text-muted">CPT {b.code}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${b.status === "captured" ? "bg-stable-bg text-stable" : "bg-warning-bg text-warning"}`}>
                  {b.status}
                </div>
                <div className="text-sm font-semibold w-14 text-right">${b.amount.toFixed(0)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, color }: { label: string; value: string | number; unit: string; color: string }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-4.5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] sm:text-xs text-muted font-semibold uppercase tracking-wide">{label}</div>
        <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
      </div>
      <div className="font-heading font-extrabold text-xl sm:text-2xl">
        {value}
        <span className="text-[12px] sm:text-[13px] font-semibold text-muted"> {unit}</span>
      </div>
    </div>
  );
}
