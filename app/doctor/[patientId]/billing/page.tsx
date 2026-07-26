import { notFound } from "next/navigation";
import { getBillingDocument } from "@/lib/queries";
import { buildSuperbill } from "@/lib/billingDocument";
import { Superbill } from "@/components/doctor/Superbill";

export default async function BillingDocumentPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const { patient, billing } = await getBillingDocument(patientId);
  if (!patient) notFound();

  const doc = buildSuperbill({
    practice: patient.practices ?? { name: "Practice" },
    clinician: patient.clinicians ?? { name: "Unassigned", role: "clinician" },
    patient: { name: patient.name, condition: patient.condition, discharge_date: patient.discharge_date },
    billing,
  });

  return <Superbill doc={doc} patientId={patientId} />;
}
