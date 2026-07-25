// Shared labels/colors for discrete wearable notification events, used by both the doctor
// dashboard (PatientDetail) and the patient portal (WearableSignalsCard) so the same event
// reads consistently on both surfaces. See MASTER-PLAN.md "Wearables detection layer" —
// event types match what Apple Watch actually exposes as discrete notifications, never a
// raw HR/HRV/BP stream.
export const WEARABLE_EVENT_LABELS: Record<string, string> = {
  hypertension_notification: "Hypertension Notification",
  irregular_rhythm_notification: "Irregular Rhythm Notification",
  high_heart_rate: "High Heart Rate",
  low_heart_rate: "Low Heart Rate",
  fall_detected: "Fall Detected",
};

export const WEARABLE_SEVERITY_COLOR: Record<string, string> = {
  info: "var(--stable)",
  warn: "var(--warning)",
  danger: "var(--critical)",
};
