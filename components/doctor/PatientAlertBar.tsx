"use client";

import { useTransition } from "react";
import { severityMeta, type Severity } from "@/lib/status";
import { reviewAlert, unreviewAlert } from "@/lib/actions";

type Alert = {
  id: string;
  severity: string;
  message: string;
  reviewed_at: string | null;
  action_taken: string | null;
};

export function PatientAlertBar({ alert }: { alert: Alert | undefined }) {
  const [isPending, startTransition] = useTransition();

  if (!alert) {
    return (
      <div className="flex-1 min-w-0 flex items-center px-3.5 sm:px-4 py-2 rounded-[10px] text-[12.5px] sm:text-[13px] font-semibold bg-stable-bg text-stable">
        Stable · No unreviewed alerts
      </div>
    );
  }

  const meta = severityMeta[alert.severity as Severity];

  if (alert.reviewed_at) {
    return (
      <div className={`flex-1 min-w-0 flex flex-col gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-[10px] ${meta.bg}`}>
        <div className={`text-[12.5px] sm:text-[13px] font-semibold ${meta.text}`}>
          {meta.label} · {alert.message}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="text-[11px] text-muted">
            Reviewed &middot; action: {alert.action_taken?.replace("_", " ")}
          </div>
          <button
            disabled={isPending}
            onClick={() => startTransition(() => unreviewAlert(alert.id))}
            className="text-[11px] font-semibold text-muted underline underline-offset-2 disabled:opacity-50"
          >
            Reopen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 min-w-0 flex flex-col gap-2 px-3.5 sm:px-4 py-2.5 rounded-[10px] ${meta.bg}`}>
      <div className={`text-[12.5px] sm:text-[13px] font-semibold ${meta.text}`}>
        {meta.label} · {alert.message}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          disabled={isPending}
          onClick={() => startTransition(() => reviewAlert(alert.id, "bring_in"))}
          className="text-[11.5px] font-semibold px-2.5 py-1 rounded-md bg-foreground text-background disabled:opacity-50"
        >
          Bring them in
        </button>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => reviewAlert(alert.id, "call_patient"))}
          className="text-[11.5px] font-semibold px-2.5 py-1 rounded-md surface-sm disabled:opacity-50"
        >
          Call patient
        </button>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => reviewAlert(alert.id, "none"))}
          className="text-[11.5px] font-semibold px-2.5 py-1 rounded-md text-muted disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
