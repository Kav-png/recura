import "server-only";
import type { Database } from "@/lib/database.types";

type Patient = Database["public"]["Tables"]["patients"]["Row"];
type BillingEvent = Database["public"]["Tables"]["billing_events"]["Row"];
type Clinician = Database["public"]["Tables"]["clinicians"]["Row"];

// research/02-us-hrrp-penalties-costs.md: avoidable-cost-per-AVOIDED-readmission figures
// (never the ~$13-15K gross readmission cost). No COPD-specific figure exists — COPD uses
// the general average, per MASTER-PLAN's figure-discipline section.
const AVOIDABLE_COST_HF = 2488;
const AVOIDABLE_COST_AMI = 3432;
const AVOIDABLE_COST_PNEUMONIA = 2278;
const AVOIDABLE_COST_GENERAL = 2140;

// research/02: HF 30-day readmission rate 22.3-23% (using midpoint 22.3%); COPD ~20%. AMI and
// pneumonia have no cleanly sourced condition-specific rate, so they use the general Medicare
// 30-day all-cause readmission rate (19.6%, Jencks et al. NEJM 2009) as the fallback baseline —
// same "no condition-specific figure -> general average" rule as COPD's cost above.
const BASELINE_READMIT_RATE_HF = 0.223;
const BASELINE_READMIT_RATE_COPD = 0.2;
const BASELINE_READMIT_RATE_GENERAL = 0.196;

// research/05-evidence-base.md: CDC Preventing Chronic Disease meta-analysis (2024) —
// pooled -21% readmission risk for outpatient follow-up <=30 days post-discharge
// (significant for HF; general post-discharge-follow-up class of evidence, applied
// conservatively across conditions here since no condition-specific reduction beyond HF is sourced).
const RELATIVE_RISK_REDUCTION = 0.21;

// research/02: HRRP FY2024 average penalty across 2,583 penalized hospitals.
export const HRRP_AVG_PENALTY = 217000;

// Per-condition economics, keyed by patients.condition. Any condition not listed here falls
// back to the general cost/rate — never invent a condition-specific number without a sourced
// research/02 entry first.
const CONDITION_ECONOMICS: Record<string, { avoidableCost: number; baselineReadmitRate: number }> = {
  HF: { avoidableCost: AVOIDABLE_COST_HF, baselineReadmitRate: BASELINE_READMIT_RATE_HF },
  COPD: { avoidableCost: AVOIDABLE_COST_GENERAL, baselineReadmitRate: BASELINE_READMIT_RATE_COPD },
  AMI: { avoidableCost: AVOIDABLE_COST_AMI, baselineReadmitRate: BASELINE_READMIT_RATE_GENERAL },
  Pneumonia: { avoidableCost: AVOIDABLE_COST_PNEUMONIA, baselineReadmitRate: BASELINE_READMIT_RATE_GENERAL },
};
const DEFAULT_ECONOMICS = { avoidableCost: AVOIDABLE_COST_GENERAL, baselineReadmitRate: BASELINE_READMIT_RATE_GENERAL };

export function computeRoiMetrics(patients: Patient[], billing: BillingEvent[]) {
  const capturedBilling = billing.filter((b) => b.status === "captured").reduce((sum, b) => sum + b.amount, 0);
  const pendingBilling = billing.filter((b) => b.status === "pending").reduce((sum, b) => sum + b.amount, 0);

  let estimatedReadmissionsAvoided = 0;
  let estimatedCostAvoided = 0;
  for (const p of patients) {
    const econ = CONDITION_ECONOMICS[p.condition] ?? DEFAULT_ECONOMICS;
    const avoided = econ.baselineReadmitRate * RELATIVE_RISK_REDUCTION;
    estimatedReadmissionsAvoided += avoided;
    estimatedCostAvoided += avoided * econ.avoidableCost;
  }

  return {
    capturedBilling,
    pendingBilling,
    estimatedReadmissionsAvoided,
    estimatedCostAvoided,
  };
}

export function computeClinicianBreakdown(clinicians: Clinician[], patients: Patient[], billing: BillingEvent[]) {
  return clinicians.map((c) => {
    const cliniciansPatients = patients.filter((p) => p.clinician_id === c.id);
    const patientIds = new Set(cliniciansPatients.map((p) => p.id));
    const capturedBilling = billing
      .filter((b) => patientIds.has(b.patient_id) && b.status === "captured")
      .reduce((sum, b) => sum + b.amount, 0);
    return {
      id: c.id,
      name: c.name,
      role: c.role,
      specialty: c.specialty,
      patientCount: cliniciansPatients.length,
      capturedBilling,
    };
  });
}

export function computeBillingByCode(billing: BillingEvent[]) {
  const codes = ["99495", "99496", "99445", "99454", "99470"];
  return codes.map((code) => {
    const rows = billing.filter((b) => b.code === code);
    const captured = rows.filter((b) => b.status === "captured");
    const pending = rows.filter((b) => b.status === "pending");
    return {
      code,
      capturedCount: captured.length,
      capturedAmount: captured.reduce((sum, b) => sum + b.amount, 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, b) => sum + b.amount, 0),
    };
  });
}

export function computeFunnel(patients: Patient[]) {
  const enrolled = patients.length;
  const tcmDone = patients.filter((p) => p.tcm_contact_done).length;
  // research/03-reimbursement-codes.md: 99445 covers 2-15 days of RPM data per 30-day period.
  const rpmReporting = patients.filter((p) => p.rpm_days_this_period >= 2).length;
  const byCondition: Record<string, number> = {};
  for (const p of patients) {
    byCondition[p.condition] = (byCondition[p.condition] ?? 0) + 1;
  }
  return { enrolled, tcmDone, rpmReporting, byCondition };
}
