import { redirect } from "next/navigation";
import { getDemoClinician, getPatientPanel } from "@/lib/queries";

export default async function DoctorIndexPage() {
  const clinician = await getDemoClinician();
  const patients = await getPatientPanel(clinician.practice_id);
  if (patients[0]) redirect(`/doctor/${patients[0].id}`);
  return <div className="text-muted text-sm">No patients enrolled yet.</div>;
}
