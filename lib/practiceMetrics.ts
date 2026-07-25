import "server-only";
import type { Database } from "@/lib/database.types";

type Patient = Database["public"]["Tables"]["patients"]["Row"];
type BillingEvent = Database["public"]["Tables"]["billing_events"]["Row"];
type Clinician = Database["public"]["Tables"]["clinicians"]["Row"];

// research/02-us-hrrp-penalties-costs.md: avoidable-cost-per-AVOIDED-readmission figures
// (never the ~$13-15K gross readmission cost). No COPD-specific figure exists — COPD uses
// the general average, per MASTER-PLAN's figure-discipline section.
const AVOIDABLE_COST_HF = 2488;
const AVOIDABLE_COST_GENERAL = 2140;

// research/02: HF 30-day readmission rate 22.3-23% (using midpoint 22.3%); COPD ~20%.
const BASELINE_READMIT_RATE_HF = 0.223;
const BASELINE_READMIT_RATE_COPD = 0.2;

// research/05-evidence-base.md: CDC Preventing Chronic Disease meta-analysis (2024) —
// pooled -21% readmission risk for outpatient follow-up <=30 days post-discharge
// (significant for HF; general post-discharge-follow-up class of evidence, applied
// conservatively to both conditions here since no COPD-specific reduction is sourced).
const RELATIVE_RISK_REDUCTION = 0.21;

// research/02: HRRP FY2024 average penalty across 2,583 penalized hospitals.
export const HRRP_AVG_PENALTY = 217000;

export function computeRoiMetrics(patients: Patient[], billing: BillingEvent[]) {
  const capturedBilling = billing.filter((b) => b.status === "captured").reduce((sum, b) => sum + b.amount, 0);
  const pendingBilling = billing.filter((b) => b.status === "pending").reduce((sum, b) => sum + b.amount, 0);

  const hfPatients = patients.filter((p) => p.condition === "HF").length;
  const copdPatients = patients.filter((p) => p.condition === "COPD").length;

  const avoidedHF = hfPatients * BASELINE_READMIT_RATE_HF * RELATIVE_RISK_REDUCTION;
  const avoidedCOPD = copdPatients * BASELINE_READMIT_RATE_COPD * RELATIVE_RISK_REDUCTION;
  const estimatedReadmissionsAvoided = avoidedHF + avoidedCOPD;
  const estimatedCostAvoided = avoidedHF * AVOIDABLE_COST_HF + avoidedCOPD * AVOIDABLE_COST_GENERAL;

  return {
    capturedBilling,
    pendingBilling,
    hfPatients,
    copdPatients,
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
  const codes = ["99495", "99445", "99470"];
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
  const byCondition = {
    HF: patients.filter((p) => p.condition === "HF").length,
    COPD: patients.filter((p) => p.condition === "COPD").length,
  };
  return { enrolled, tcmDone, rpmReporting, byCondition };
}
