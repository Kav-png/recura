"use client";

import { useTransition } from "react";
import { severityMeta, timeAgo, type Severity } from "@/lib/status";
import { reviewAlert } from "@/lib/actions";

type Alert = {
  id: string;
  severity: string;
  message: string;
  sent_at: string;
  reviewed_at: string | null;
  action_taken: string | null;
  patients: { name: string } | null;
};

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  const [isPending, startTransition] = useTransition();
  const criticalCount = alerts.filter((a) => a.severity === "danger" && !a.reviewed_at).length;

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3.5">
        <div className="font-heading font-bold text-[15px]">Alerts</div>
        {criticalCount > 0 && (
          <div className="text-xs text-critical bg-critical-bg px-2.5 py-0.5 rounded-full font-semibold">
            {criticalCount} critical
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2.5">
        {alerts.length === 0 && <div className="text-sm text-muted">No alerts.</div>}
        {alerts.map((a) => {
          const meta = severityMeta[a.severity as Severity];
          return (
            <div key={a.id} className={`p-3 rounded-xl ${meta.bg}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-[13px] font-bold text-foreground">{a.patients?.name ?? "Unknown patient"}</div>
                <div className="text-[11px] text-muted shrink-0">{timeAgo(a.sent_at)}</div>
              </div>
              <div className="text-[12.5px] text-foreground/70 mt-0.5 leading-snug">{a.message}</div>
              {a.reviewed_at ? (
                <div className="text-[11px] text-muted mt-1.5">
                  Reviewed &middot; action: {a.action_taken?.replace("_", " ")}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(() => reviewAlert(a.id, "bring_in"))}
                    className="text-[11.5px] font-semibold px-2.5 py-1 rounded-md bg-foreground text-background disabled:opacity-50"
                  >
                    Bring them in
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(() => reviewAlert(a.id, "call_patient"))}
                    className="text-[11.5px] font-semibold px-2.5 py-1 rounded-md bg-surface border border-border disabled:opacity-50"
                  >
                    Call patient
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(() => reviewAlert(a.id, "none"))}
                    className="text-[11.5px] font-semibold px-2.5 py-1 rounded-md text-muted disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
