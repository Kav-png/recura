import { Bell } from "lucide-react";
import { SearchBox } from "@/components/doctor/SearchBox";

function initials(name: string) {
  return name
    .replace(/^Dr\.\s*/, "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function Topbar({
  clinicianName,
  role,
  specialty,
  unreadAlertCount,
  patients,
}: {
  clinicianName: string;
  role: string;
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
        <div className="relative w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-muted-bg flex items-center justify-center shrink-0">
          <Bell size={18} className="text-foreground/70" />
          {unreadAlertCount > 0 && (
            <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-critical border-2 border-surface" />
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-border">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-primary/60 flex items-center justify-center font-heading font-bold text-foreground/80 text-sm shrink-0">
            {initials(clinicianName)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{clinicianName}</div>
            <div className="text-xs text-muted capitalize">{role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
