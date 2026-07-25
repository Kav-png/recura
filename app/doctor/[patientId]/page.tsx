import { notFound } from "next/navigation";
import { PatientDetail } from "@/components/doctor/PatientDetail";
import { getPatientDetail } from "@/lib/queries";

export default async function DoctorPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const { patient, medications, redFlags, checkins, alerts, billing, wearableEvents } = await getPatientDetail(patientId);

  if (!patient) notFound();

  return (
    <PatientDetail
      patient={patient}
      medications={medications}
      redFlags={redFlags}
      checkins={checkins}
      alerts={alerts}
      billing={billing}
      wearableEvents={wearableEvents}
    />
  );
}
