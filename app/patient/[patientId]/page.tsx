import { notFound } from "next/navigation";
import { getPatientDetail } from "@/lib/queries";
import { emergencyNumberFor } from "@/lib/emergency";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { StatusCard } from "@/components/patient/StatusCard";
import { MedicationsCard } from "@/components/patient/MedicationsCard";
import { WatchForCard } from "@/components/patient/WatchForCard";
import { WearableSignalsCard } from "@/components/patient/WearableSignalsCard";
import { CheckinHistoryCard } from "@/components/patient/CheckinHistoryCard";
import { SelfCheckinForm } from "@/components/patient/SelfCheckinForm";

export const dynamic = "force-dynamic";

export default async function PatientPortalPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const { patient, medications, redFlags, checkins, alerts, wearableEvents } = await getPatientDetail(patientId);

  if (!patient) notFound();

  const hasOpenAlerts = alerts.some((a) => !a.reviewed_at);
  const emergencyNumber = emergencyNumberFor(patient.practices?.country);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <PatientHeader name={patient.name} dischargeDate={patient.discharge_date} condition={patient.condition} />
      <StatusCard hasOpenAlerts={hasOpenAlerts} emergencyNumber={emergencyNumber} />
      <MedicationsCard medications={medications} />
      <WatchForCard redFlags={redFlags} />
      <WearableSignalsCard events={wearableEvents} />
      <CheckinHistoryCard patientId={patient.id} checkins={checkins} />
      <SelfCheckinForm patientId={patient.id} emergencyNumber={emergencyNumber} />
    </div>
  );
}
