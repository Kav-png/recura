"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { severityMeta, daysSince, type Severity } from "@/lib/status";

type PanelPatient = {
  id: string;
  name: string;
  condition: string;
  discharge_date: string;
  status: string;
  latestCheckin: { proms_score: number | null } | null;
  capturedBilling: number;
  pendingBilling: number;
};

export function PatientList({ patients }: { patients: PanelPatient[] }) {
  const pathname = usePathname();
  const selectedId = pathname?.split("/doctor/")[1];
  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col">
      <div className="px-4.5 pt-4.5 pb-3 flex items-center justify-between">
        <div className="font-heading font-bold text-[15px]">My Patients</div>
        <div className="text-xs text-muted bg-muted-bg px-2.5 py-0.5 rounded-full">{patients.length} active</div>
      </div>
      <div className="flex flex-col px-2.5 pb-2.5 gap-1 max-h-[50vh] lg:max-h-[640px] overflow-y-auto">
        {patients.map((p) => {
          const meta = severityMeta[(p.status as Severity) ?? "stable"];
          const selected = p.id === selectedId;
          return (
            <Link
              key={p.id}
              href={`/doctor/${p.id}`}
              className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors ${
                selected ? "bg-primary/10" : "hover:bg-muted-bg"
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-[38px] h-[38px] rounded-full bg-primary/70 flex items-center justify-center font-heading font-bold text-white text-[13px]">
                  {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] rounded-full ${meta.dot} border-2 border-surface`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{p.name}</div>
                <div className="text-xs text-muted flex items-center gap-1.5 flex-wrap">
                  <span>
                    Day {daysSince(p.discharge_date)} post-discharge &middot; {p.condition}
                  </span>
                  {p.capturedBilling > 0 && (
                    <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full bg-stable-bg text-stable">
                      ${p.capturedBilling.toFixed(0)}
                    </span>
                  )}
                  {p.pendingBilling > 0 && (
                    <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full bg-warning-bg text-warning">
                      ${p.pendingBilling.toFixed(0)} pending
                    </span>
                  )}
                </div>
              </div>
              <div className={`font-heading font-bold text-[13px] shrink-0 ${meta.text}`}>
                {p.latestCheckin?.proms_score ?? "—"}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
