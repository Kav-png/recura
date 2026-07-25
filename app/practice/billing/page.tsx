import { getDemoClinician, getBillingRun } from "@/lib/queries";
import { buildBillingRun } from "@/lib/billingDocument";
import { BillingRun } from "@/components/practice/BillingRun";

export const dynamic = "force-dynamic";

export default async function PracticeBillingRunPage() {
  const clinician = await getDemoClinician();
  const { practice, patients, billing } = await getBillingRun(clinician.practice_id);
  const doc = buildBillingRun(practice.name, patients, billing);

  return <BillingRun doc={doc} />;
}
