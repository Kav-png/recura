import Link from "next/link";
import { daysSince } from "@/lib/status";
import { CONDITION_LABELS } from "./copy";

type Patient = { id: string; name: string; condition: string; discharge_date: string };

export function PatientPicker({ patients }: { patients: Patient[] }) {
  return (
    <div className="flex flex-col gap-3">
      {patients.length === 0 && <p className="text-sm text-muted">No patients enrolled yet.</p>}
      {patients.map((p) => {
        const days = Math.max(daysSince(p.discharge_date), 0);
        return (
          <Link
            key={p.id}
            href={`/patient/${p.id}`}
            className="bg-surface rounded-2xl border border-border px-5 py-4 flex items-center justify-between gap-3 hover:border-primary transition-colors"
          >
            <div className="min-w-0">
              <div className="font-heading font-bold text-[16px]">{p.name}</div>
              <div className="text-[13px] text-muted mt-0.5">
                Day {days} · Recovering from {CONDITION_LABELS[p.condition] ?? p.condition}
              </div>
            </div>
            <span className="text-muted shrink-0" aria-hidden="true">
              →
            </span>
          </Link>
        );
      })}
    </div>
  );
}
