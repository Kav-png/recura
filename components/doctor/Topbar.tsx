import { Bell } from "lucide-react";
import { SearchBox } from "@/components/doctor/SearchBox";
import { AddPatientButton } from "@/components/doctor/AddPatientButton";

export function Topbar({
  clinicianName,
  specialty,
  unreadAlertCount,
  patients,
}: {
  clinicianName: string;
  specialty: string | null;
  unreadAlertCount: number;
  patients: { id: string; name: string; condition: string; status: string }[];
}) {
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 lg:pt-7 pb-3 lg:pb-4 bg-background">
      <div className="min-w-0">
        <div className="font-heading font-extrabold text-lg sm:text-xl lg:text-2xl tracking-tight truncate">
          Good morning, {clinicianName}
        </div>
        <div className="text-xs sm:text-sm text-muted mt-0.5 truncate">
          {today} &middot; {specialty ?? "Post-discharge panel"}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <SearchBox patients={patients} />
        <AddPatientButton />
        <div className="relative w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-muted-bg flex items-center justify-center shrink-0">
          <Bell size={18} className="text-foreground/70" />
          {unreadAlertCount > 0 && (
            <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-critical border-2 border-surface" />
          )}
        </div>
      </div>
    </div>
  );
}
