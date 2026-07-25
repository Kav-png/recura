import { getDemoPracticeId, getPatientsForPortal } from "@/lib/queries";
import { PatientPicker } from "@/components/patient/PatientPicker";

export const dynamic = "force-dynamic";

// No per-patient login for this hackathon demo (single shared practice access code, per
// CLAUDE.md/MASTER-PLAN.md). This picker exists purely so the demo can jump between patients —
// a real deployment would skip this screen and send each patient straight to their own
// /patient/[patientId] from their personal login link.
export default async function PatientPickerPage() {
  const practiceId = await getDemoPracticeId();
  const patients = await getPatientsForPortal(practiceId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading font-extrabold text-2xl">Welcome back</h1>
        <p className="text-muted text-[14px] mt-1">Choose your name to see your recovery plan.</p>
      </div>
      <PatientPicker patients={patients} />
    </div>
  );
}
