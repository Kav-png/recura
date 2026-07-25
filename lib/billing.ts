import "server-only";

// Rates from research/03-reimbursement-codes.md (2026 national averages — vary by locality).
// 99445/99454 are quoted there as a ~$47-52 range; we use the midpoint.
export const CPT_RATES: Record<string, { amount: number; label: string }> = {
  "99495": { amount: 201, label: "TCM — moderate complexity (2-day contact, F2F ≤14 days)" },
  "99496": { amount: 273, label: "TCM — high complexity (2-day contact, F2F ≤7 days)" },
  "99445": { amount: 50, label: "RPM device supply (2–15 days data / 30d)" },
  "99454": { amount: 50, label: "RPM device supply (16+ days data / 30d)" },
  "99470": { amount: 26, label: "RPM management, first 10 min live contact" },
  "99457": { amount: 52, label: "RPM management, first 20 min live contact" },
};

const DAY_MS = 24 * 60 * 60 * 1000;

// research/03 ⚠️ AI-eligibility rules: the TCM 2-day contact and the RPM/RTM "interactive
// communication" must both be live/synchronous and made by a clinician — CMS guidance explicitly
// excludes "digital assistants such as chat bots, Siri, or Alexa". A billing event can only ever
// be marked "captured" if it traces to one of these three human-performed contact methods.
const LIVE_CONTACT_METHODS = new Set(["phone_live", "video_live", "in_person"]);

function isLiveContact(method: string | null): boolean {
  return !!method && LIVE_CONTACT_METHODS.has(method);
}

export type BillingPatientInput = {
  discharge_date: string;
  tcm_contact_done: boolean;
  tcm_contact_by: string | null;
  tcm_contact_method: string | null;
  tcm_contact_date: string | null;
  tcm_med_reconciliation_at: string | null;
  tcm_mdm_level: string | null;
  f2f_scheduled_date: string | null;
  rpm_days_this_period: number;
  rpm_live_contact_at: string | null;
  rpm_live_contact_by: string | null;
  rpm_live_contact_method: string | null;
  rpm_live_contact_minutes: number | null;
};

export type ComputedBillingEvent = {
  code: string;
  amount: number;
  status: "pending" | "captured";
  period_start: string;
  period_end: string;
};

/**
 * Derives the billing_events that SHOULD exist for a patient's current 30-day post-discharge
 * episode, purely from the compliance fields a clinician has actually logged — this replaces
 * hand-seeded demo numbers with a computed, re-runnable source of truth (see
 * lib/actions.ts#reconcileBillingForPatient, which upserts this output).
 */
export function computeExpectedBilling(patient: BillingPatientInput, now: Date = new Date()): ComputedBillingEvent[] {
  const events: ComputedBillingEvent[] = [];
  const dischargeDate = new Date(patient.discharge_date);
  const periodStart = dischargeDate.toISOString().slice(0, 10);
  const periodEnd = new Date(dischargeDate.getTime() + 30 * DAY_MS).toISOString().slice(0, 10);
  const daysSinceDischarge = Math.floor((now.getTime() - dischargeDate.getTime()) / DAY_MS);

  // TCM (99495/99496) — once per episode. CMS requires the interactive contact itself to have
  // happened ≤2 business days post-discharge, not just have been logged eventually — so a live
  // contact recorded past that window still can't bill (checked via tcm_contact_date, approximated
  // as calendar days like the pending-window check below).
  const tcmContactDelay = patient.tcm_contact_date
    ? Math.floor((new Date(patient.tcm_contact_date).getTime() - dischargeDate.getTime()) / DAY_MS)
    : null;
  const tcmLive =
    patient.tcm_contact_done &&
    !!patient.tcm_contact_by &&
    isLiveContact(patient.tcm_contact_method) &&
    tcmContactDelay !== null &&
    tcmContactDelay <= 2;
  if (tcmLive) {
    // Code selection: CMS keys 99495 vs 99496 off documented medical-decision-making complexity,
    // not the F2F date directly — prefer the clinician-recorded tcm_mdm_level and only fall back
    // to the F2F-day heuristic when no MDM level has been logged yet.
    const f2fDays = patient.f2f_scheduled_date
      ? Math.floor((new Date(patient.f2f_scheduled_date).getTime() - dischargeDate.getTime()) / DAY_MS)
      : null;
    const code =
      patient.tcm_mdm_level === "high"
        ? "99496"
        : patient.tcm_mdm_level === "moderate"
          ? "99495"
          : f2fDays !== null && f2fDays <= 7
            ? "99496"
            : "99495";
    // Medication reconciliation is a required element of the TCM service itself (CMS TCM
    // requirements) — the live contact alone isn't sufficient to bill until it's documented.
    const medReconDone = !!patient.tcm_med_reconciliation_at;
    events.push({
      code,
      amount: CPT_RATES[code].amount,
      status: medReconDone ? "captured" : "pending",
      period_start: periodStart,
      period_end: periodEnd,
    });
  } else if (daysSinceDischarge <= 2) {
    // Inside the 2-business-day window — accruing, not yet billable, not yet missed.
    events.push({ code: "99495", amount: CPT_RATES["99495"].amount, status: "pending", period_start: periodStart, period_end: periodEnd });
  }
  // Past day 2 with no live contact logged: CMS allows the TCM contact once, ≤2 business days
  // post-discharge — the window has closed, so no event is generated (a "pending" row here would
  // misrepresent a permanently missed claim as still billable).

  // RPM device-supply (99445/99454) + management (99457/99470) — both require the live interactive
  // touch; device-day accrual alone is never enough to bill.
  const rpmLive = !!patient.rpm_live_contact_at && !!patient.rpm_live_contact_by && isLiveContact(patient.rpm_live_contact_method);
  if (patient.rpm_days_this_period >= 2) {
    const code = patient.rpm_days_this_period >= 16 ? "99454" : "99445";
    events.push({
      code,
      amount: CPT_RATES[code].amount,
      status: rpmLive ? "captured" : "pending",
      period_start: periodStart,
      period_end: periodEnd,
    });
    if (rpmLive) {
      // 99457 (≥20 min) and 99470 (10–19 min) are mutually exclusive — the logged duration of the
      // live touch is what CMS audits against, not just that a contact happened.
      const minutes = patient.rpm_live_contact_minutes;
      const mgmtCode = minutes !== null && minutes >= 20 ? "99457" : "99470";
      events.push({
        code: mgmtCode,
        amount: CPT_RATES[mgmtCode].amount,
        status: minutes !== null && minutes >= 10 ? "captured" : "pending",
        period_start: periodStart,
        period_end: periodEnd,
      });
    }
  }

  return events;
}
