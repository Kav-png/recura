import { severityMeta, daysSince, timeAgo, type Severity } from "@/lib/status";
import { CheckinCallButton } from "@/components/doctor/CheckinCallButton";
import { RemovePatientButton } from "@/components/doctor/RemovePatientButton";
import { EditPatientButton } from "@/components/doctor/EditPatientButton";
import { ComplianceActions } from "@/components/doctor/ComplianceActions";
import { PatientAlertBar } from "@/components/doctor/PatientAlertBar";
import { WEARABLE_EVENT_LABELS, WEARABLE_SEVERITY_COLOR } from "@/lib/wearableEvents";
import { TrendChart } from "@/components/doctor/TrendChart";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  discharge_date: string;
  condition: string;
  resuscitation_status: string | null;
  emergency_contact_name: string | null;
  follow_up_clinic: string | null;
  access_code: string | null;
  tcm_contact_done: boolean;
  tcm_contact_date: string | null;
  tcm_contact_method: string | null;
  tcm_med_reconciliation_at: string | null;
  tcm_mdm_level: string | null;
  f2f_scheduled_date: string | null;
  rpm_days_this_period: number;
  rpm_live_contact_at: string | null;
  rpm_live_contact_method: string | null;
  rpm_live_contact_minutes: number | null;
  consent_captured_at: string | null;
  clinicians: { name: string; role: string } | null;
  tcm_clinician: { name: string } | null;
  rpm_clinician: { name: string } | null;
};

type Medication = { id: string; name: string; dose: string | null; frequency: string | null; status: string; reason: string | null };
type RedFlag = { id: string; severity: string; title: string; explanation_plain_english: string; source: string };
type Allergy = { id: string; allergen: string; reaction: string | null; severity: string | null };
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
  "99454": "RPM device supply (16+ days data)",
  "99470": "RPM management, first 10 min",
  "99457": "RPM management, first 20 min",
};

const MDM_LABELS: Record<string, string> = { moderate: "Moderate complexity", high: "High complexity" };

const medStatusColor: Record<string, string> = {
  new: "bg-primary",
  changed: "bg-warning",
  stopped: "bg-critical",
  unchanged: "bg-stable",
};

export function PatientDetail({
  patient,
  medications,
  redFlags,
  allergies,
  checkins,
  alerts,
  billing,
  wearableEvents,
}: {
  patient: Patient;
  medications: Medication[];
  redFlags: RedFlag[];
  allergies: Allergy[];
  checkins: Checkin[];
  alerts: Alert[];
  billing: BillingEvent[];
  wearableEvents: WearableEvent[];
}) {
  const unreviewedByPriority = alerts.filter((a) => !a.reviewed_at).sort((a, b) => {
    const rank: Record<string, number> = { danger: 3, warn: 2, info: 1 };
    return rank[b.severity] - rank[a.severity];
  });
  const mostRecentAlert = [...alerts].sort(
    (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  )[0];
  // Prefer the highest-severity thing still needing a decision; fall back to the
  // most recent alert (even if already reviewed) so the header keeps showing what
  // just happened instead of reverting to a blank "stable" state after review.
  const headerAlert = unreviewedByPriority[0] ?? mostRecentAlert;
  const orderedCheckins = [...checkins].sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime());
  const latest = orderedCheckins[0];

  return (
    <div className="flex flex-col gap-4 sm:gap-5 min-w-0">
      {/* Header */}
      <div className="surface rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between flex-wrap gap-3">
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
            {(patient.resuscitation_status || patient.emergency_contact_name || patient.follow_up_clinic) && (
              <div className="text-[12px] sm:text-[12.5px] text-muted mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {patient.resuscitation_status && (
                  <span className="font-semibold text-foreground/80">{patient.resuscitation_status}</span>
                )}
                {patient.emergency_contact_name && <span>Emergency contact: {patient.emergency_contact_name}</span>}
                {patient.follow_up_clinic && <span>Follow-up: {patient.follow_up_clinic}</span>}
              </div>
            )}
            {patient.access_code && (
              <div className="text-[11.5px] text-muted mt-1.5">
                Patient portal code:{" "}
                <span className="font-mono font-semibold tracking-wider text-foreground/80 bg-muted-bg px-1.5 py-0.5 rounded">
                  {patient.access_code}
                </span>
                <span className="ml-1">— give this to the patient; it opens only their own portal page.</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <PatientAlertBar alert={headerAlert} />
          <CheckinCallButton
            patientId={patient.id}
            patientName={patient.name}
            patientPhone={patient.phone}
            showBrowserDemo={false}
          />
          <EditPatientButton patient={patient} medications={medications} />
          <RemovePatientButton patientId={patient.id} patientName={patient.name} />
        </div>
      </div>

      {/* Allergies — safety-critical, shown alongside red flags */}
      {allergies.length > 0 && (
        <div className="surface rounded-2xl p-4 sm:p-5">
          <div className="font-heading font-bold text-[15px] mb-3.5">Allergies &amp; Adverse Reactions</div>
          <div className="flex flex-col gap-2.5">
            {allergies.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-warning-bg">
                <div className="text-[13px] font-bold">{a.allergen}</div>
                {(a.reaction || a.severity) && (
                  <div className="text-[12.5px] text-foreground/70 mt-0.5">
                    {a.reaction}
                    {a.reaction && a.severity ? " — " : null}
                    {a.severity}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red flags — the evidence, front and center under the decision bar */}
      {redFlags.length > 0 && (
        <div className="surface rounded-2xl p-4 sm:p-5">
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
        <div className="surface rounded-2xl p-4 sm:p-5">
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Latest PROMs" value={latest?.proms_score ?? "—"} unit="/ 100" color={severityMeta[(headerAlert?.severity as Severity) ?? "stable"].dot} />
        <StatCard label="Days post-discharge" value={daysSince(patient.discharge_date)} unit="days" color="bg-stable" />
        <StatCard
          label="TCM 2-day contact"
          value={patient.tcm_contact_done ? "Done" : "Pending"}
          unit=""
          color={patient.tcm_contact_done ? "bg-stable" : "bg-warning"}
        />
        <StatCard label="RPM days this period" value={patient.rpm_days_this_period} unit="/ 30" color="bg-stable" />
      </div>

      <TrendChart checkins={orderedCheckins} wearableEvents={wearableEvents} dischargeDate={patient.discharge_date} />

      {/* Medications */}
      <div className="surface rounded-2xl p-4 sm:p-5">
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
      <div className="surface rounded-2xl p-4 sm:p-5">
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
      <div className="surface rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-heading font-bold text-[15px]">Episode Billing Status</div>
          {billing.length > 0 && (
            <a
              href={`/doctor/${patient.id}/billing`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold text-primary hover:underline"
            >
              View billing document →
            </a>
          )}
        </div>
        {billing.length === 0 && (
          <div className="text-[12.5px] text-muted mb-2">
            No billing events yet — log a live TCM or RPM contact below to generate them automatically.
          </div>
        )}
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

      {/* Compliance / billing audit trail */}
      <div className="surface rounded-2xl p-4 sm:p-5">
        <div className="font-heading font-bold text-[15px] mb-1">Compliance Log</div>
        <div className="text-[12px] text-muted mb-3.5">
          CMS requires the TCM 2-day contact and RPM monthly communication to be made by a qualified clinician,
          live and synchronous — AI check-in calls satisfy neither requirement on their own.
        </div>
        <div className="flex flex-col gap-2.5">
          <ComplianceRow
            label="TCM 2-day contact"
            done={patient.tcm_contact_done}
            by={patient.tcm_clinician?.name ?? null}
            method={patient.tcm_contact_method}
            at={patient.tcm_contact_date}
            extra={patient.tcm_mdm_level ? MDM_LABELS[patient.tcm_mdm_level] ?? patient.tcm_mdm_level : null}
          />
          <div className={`p-3 rounded-xl ${patient.tcm_med_reconciliation_at ? "bg-stable-bg" : "bg-warning-bg"}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[13px] font-semibold">Medication reconciliation</div>
              <div className={`text-[11px] font-semibold ${patient.tcm_med_reconciliation_at ? "text-stable" : "text-warning"}`}>
                {patient.tcm_med_reconciliation_at ? "Complete" : "Pending"}
              </div>
            </div>
            {patient.tcm_med_reconciliation_at && (
              <div className="text-[12px] text-foreground/70 mt-1">
                {new Date(patient.tcm_med_reconciliation_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} &middot; required element of the TCM service, not just the 2-day contact
              </div>
            )}
          </div>
          <ComplianceRow
            label="RPM live communication"
            done={!!patient.rpm_live_contact_at}
            by={patient.rpm_clinician?.name ?? null}
            method={patient.rpm_live_contact_method}
            at={patient.rpm_live_contact_at}
            extra={patient.rpm_live_contact_minutes != null ? `${patient.rpm_live_contact_minutes} min logged` : null}
          />
          <ComplianceActions
            patientId={patient.id}
            tcmDone={patient.tcm_contact_done}
            tcmMedReconDone={!!patient.tcm_med_reconciliation_at}
            tcmMdmLevel={patient.tcm_mdm_level}
            rpmLiveDone={!!patient.rpm_live_contact_at}
          />
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted-bg">
            <div className="text-[13px] font-semibold">Consent captured at enrollment</div>
            <div className="text-[12px] text-muted">
              {patient.consent_captured_at ? new Date(patient.consent_captured_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not on file"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const METHOD_LABELS: Record<string, string> = {
  phone_live: "live phone call",
  video_live: "live video call",
  in_person: "in person",
};

function ComplianceRow({
  label,
  done,
  by,
  method,
  at,
  extra,
}: {
  label: string;
  done: boolean;
  by: string | null;
  method: string | null;
  at: string | null;
  extra?: string | null;
}) {
  return (
    <div className={`p-3 rounded-xl ${done ? "bg-stable-bg" : "bg-warning-bg"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[13px] font-semibold">{label}</div>
        <div className={`text-[11px] font-semibold ${done ? "text-stable" : "text-warning"}`}>{done ? "Complete" : "Pending"}</div>
      </div>
      {done && by && (
        <div className="text-[12px] text-foreground/70 mt-1">
          By {by} &middot; {method ? METHOD_LABELS[method] ?? method : "method not recorded"}
          {at ? <> &middot; {new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</> : null}
          {extra ? <> &middot; {extra}</> : null}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, unit, color }: { label: string; value: string | number; unit: string; color: string }) {
  return (
    <div className="surface rounded-2xl p-3.5 sm:p-4.5">
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
