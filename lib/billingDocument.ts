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
