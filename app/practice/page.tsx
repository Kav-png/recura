import { redirect } from "next/navigation";
import { Sidebar } from "@/components/doctor/Sidebar";
import { PracticeHeader } from "@/components/practice/PracticeHeader";
import { RoiOverview } from "@/components/practice/RoiOverview";
import { ClinicianBreakdown } from "@/components/practice/ClinicianBreakdown";
import { EnrollmentFunnel } from "@/components/practice/EnrollmentFunnel";
import { BillingByCode } from "@/components/practice/BillingByCode";
import { WhyUncaptured } from "@/components/practice/WhyUncaptured";
import { getCurrentClinician, getPracticeOverview } from "@/lib/queries";
import { computeRoiMetrics, computeClinicianBreakdown, computeBillingByCode, computeFunnel } from "@/lib/practiceMetrics";

export const dynamic = "force-dynamic";

// Practice-wide aggregates only make sense computed over every patient in the practice — a
// non-admin clinician's queries are RLS-scoped to their own patients (see migration
// add_clinician_auth_and_audit_log), so this page would otherwise silently render a wrong,
// partial rollup (e.g. every other clinician showing 0 patients) instead of an honest total.
export default async function PracticePage() {
  const clinician = await getCurrentClinician();
  if (!clinician.is_admin) redirect("/doctor");

  const { practice, clinicians, patients, billing } = await getPracticeOverview(clinician.practice_id);

  const roi = computeRoiMetrics(patients, billing);
  const clinicianRows = computeClinicianBreakdown(clinicians, patients, billing);
  const billingByCode = computeBillingByCode(billing);
  const funnel = computeFunnel(patients);

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <Sidebar clinicianName={clinician.name} />
      <div className="flex flex-col min-w-0 pt-24 lg:pt-0 lg:pl-[124px]">
        <PracticeHeader
          practiceName={practice.name}
          clinicianCount={clinicians.length}
          activePatientCount={patients.length}
        />
        <div className="flex-1 flex flex-col gap-4 sm:gap-5 p-4 sm:p-6 lg:p-8">
          <RoiOverview
            capturedBilling={roi.capturedBilling}
            pendingBilling={roi.pendingBilling}
            estimatedReadmissionsAvoided={roi.estimatedReadmissionsAvoided}
            estimatedCostAvoided={roi.estimatedCostAvoided}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
            <EnrollmentFunnel
              enrolled={funnel.enrolled}
              tcmDone={funnel.tcmDone}
              rpmReporting={funnel.rpmReporting}
              byCondition={funnel.byCondition}
            />
            <BillingByCode rows={billingByCode} />
          </div>

          <WhyUncaptured />

          <ClinicianBreakdown rows={clinicianRows} />
        </div>
      </div>
    </div>
  );
}
