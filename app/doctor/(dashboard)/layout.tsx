import { Sidebar } from "@/components/doctor/Sidebar";
import { Topbar } from "@/components/doctor/Topbar";
import { PatientList } from "@/components/doctor/PatientList";
import { AlertsPanel } from "@/components/doctor/AlertsPanel";
import { Schedule } from "@/components/doctor/Schedule";
import { getCurrentClinician, getPatientPanel, getAlertsPanel, getUpcomingCheckins } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const clinician = await getCurrentClinician();
  const practiceId = clinician.practice_id;

  const [patients, alerts, schedule] = await Promise.all([
    getPatientPanel(practiceId),
    getAlertsPanel(practiceId),
    getUpcomingCheckins(practiceId),
  ]);

  const unreadAlertCount = alerts.filter((a) => !a.reviewed_at).length;

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <Sidebar clinicianName={clinician.name} />
      <div className="flex flex-col min-w-0 pt-24 lg:pt-0 lg:pl-[124px]">
        <Topbar
          clinicianName={clinician.name}
          specialty={clinician.specialty}
          unreadAlertCount={unreadAlertCount}
          patients={patients}
        />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-4 sm:gap-5 p-4 sm:p-6 lg:p-8 items-start">
          <div className="lg:sticky lg:top-8">
            <PatientList patients={patients} />
          </div>
          <div className="min-w-0">{children}</div>
          <div className="flex flex-col gap-4 sm:gap-5 lg:sticky lg:top-8">
            <AlertsPanel alerts={alerts} />
            <Schedule items={schedule} />
          </div>
        </div>
      </div>
    </div>
  );
}
