import { redirect } from "next/navigation";
import { getCurrentClinician, getBillingRun } from "@/lib/queries";
import { buildBillingRun } from "@/lib/billingDocument";
import { BillingRun } from "@/components/practice/BillingRun";

export const dynamic = "force-dynamic";

// Same reasoning as /practice: a practice-wide billing run is meaningless (and wrong) if computed
// over a non-admin's RLS-scoped view of only their own patients.
export default async function PracticeBillingRunPage() {
  const clinician = await getCurrentClinician();
  if (!clinician.is_admin) redirect("/doctor");

  const { practice, patients, billing } = await getBillingRun(clinician.practice_id);
  const doc = buildBillingRun(practice.name, patients, billing);

  return <BillingRun doc={doc} />;
}
