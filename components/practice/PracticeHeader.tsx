import { Building2 } from "lucide-react";

export function PracticeHeader({
  practiceName,
  clinicianCount,
  activePatientCount,
}: {
  practiceName: string;
  clinicianCount: number;
  activePatientCount: number;
}) {
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 lg:pt-7 pb-3 lg:pb-4 bg-background">
      <div className="min-w-0">
        <div className="font-heading font-extrabold text-lg sm:text-xl lg:text-2xl tracking-tight truncate">
          {practiceName}
        </div>
        <div className="text-xs sm:text-sm text-muted mt-0.5 truncate">
          {today} &middot; {clinicianCount} {clinicianCount === 1 ? "clinician" : "clinicians"} &middot;{" "}
          {activePatientCount} active {activePatientCount === 1 ? "patient" : "patients"}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2.5 bg-muted-bg rounded-xl px-4 py-2.5 shrink-0">
        <Building2 size={16} className="text-muted shrink-0" />
        <span className="text-muted text-sm font-semibold whitespace-nowrap">Practice overview</span>
      </div>
    </div>
  );
}
