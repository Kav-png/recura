import { CPT_RATES } from "@/lib/billing";

// research/03-reimbursement-codes.md "Diagnosis codes for superbill generation" — standard CMS
// ICD-10-CM "unspecified" defaults, placeholders pending real clinical coding by billing staff.
export const ICD10_BY_CONDITION: Record<string, { code: string; label: string }> = {
  HF: { code: "I50.9", label: "Heart failure, unspecified" },
  COPD: { code: "J44.9", label: "Chronic obstructive pulmonary disease, unspecified" },
  AMI: { code: "I21.9", label: "Acute myocardial infarction, unspecified" },
  Pneumonia: { code: "J18.9", label: "Pneumonia, unspecified organism" },
};

export type SuperbillInput = {
  practice: { name: string };
  clinician: { name: string; role: string };
  patient: { name: string; condition: string; discharge_date: string };
  billing: { code: string; amount: number; status: string }[];
};

export type SuperbillLine = { code: string; label: string; dx: string; amount: number; status: string };

export type BillingRunRow = {
  patientName: string;
  clinicianName: string;
  code: string;
  label: string;
  dx: string;
  amount: number;
  status: string;
};

export type BillingRunDoc = {
  practiceName: string;
  generatedAt: string;
  rows: BillingRunRow[];
  readyTotal: number;
  pendingTotal: number;
};

/**
 * The practice-level counterpart to buildSuperbill: every billable/pending row across every
 * patient, in one document a biller can actually work from to submit a batch of claims — instead
 * of the practice dashboard just showing a captured-dollar-total with nothing behind it.
 */
export function buildBillingRun(
  practiceName: string,
  patients: { id: string; name: string; condition: string; clinicians: { name: string } | null }[],
  billing: { patient_id: string; code: string; amount: number; status: string }[]
): BillingRunDoc {
  const patientById = new Map(patients.map((p) => [p.id, p]));

  const rows: BillingRunRow[] = billing
    .map((b) => {
      const patient = patientById.get(b.patient_id);
      if (!patient) return null;
      const dx = ICD10_BY_CONDITION[patient.condition]?.code ?? "Z09";
      const row: BillingRunRow = {
        patientName: patient.name,
        clinicianName: patient.clinicians?.name ?? "Unassigned",
        code: b.code,
        label: CPT_RATES[b.code]?.label ?? b.code,
        dx,
        amount: b.amount,
        status: b.status,
      };
      return row;
    })
    .filter((r): r is BillingRunRow => r !== null)
    .sort((a, b) => a.patientName.localeCompare(b.patientName));

  return {
    practiceName,
    generatedAt: new Date().toISOString(),
    rows,
    readyTotal: rows.filter((r) => r.status === "captured").reduce((sum, r) => sum + r.amount, 0),
    pendingTotal: rows.filter((r) => r.status !== "captured").reduce((sum, r) => sum + r.amount, 0),
  };
}

export type SuperbillDoc = {
  practice: { name: string };
  clinician: { name: string; role: string };
  patient: { name: string; condition: string; discharge_date: string };
  dx: { code: string; label: string };
  lines: SuperbillLine[];
  capturedTotal: number;
  pendingTotal: number;
  generatedAt: string;
};

/** Builds the printable billing-document (superbill) data for a patient's current episode. */
export function buildSuperbill({ practice, clinician, patient, billing }: SuperbillInput): SuperbillDoc {
  const dx = ICD10_BY_CONDITION[patient.condition] ?? { code: "Z09", label: "Encounter for follow-up exam" };
  const lines: SuperbillLine[] = billing.map((b) => ({
    code: b.code,
    label: CPT_RATES[b.code]?.label ?? b.code,
    dx: dx.code,
    amount: b.amount,
    status: b.status,
  }));

  return {
    practice,
    clinician,
    patient,
    dx,
    lines,
    capturedTotal: billing.filter((b) => b.status === "captured").reduce((sum, b) => sum + b.amount, 0),
    pendingTotal: billing.filter((b) => b.status !== "captured").reduce((sum, b) => sum + b.amount, 0),
    generatedAt: new Date().toISOString(),
  };
}
