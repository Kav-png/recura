"use client";

import { useState, useTransition } from "react";
import { recordTcmContact, recordRpmLiveContact, logRpmDeviceDay, scheduleF2F, type LiveContactMethod } from "@/lib/actions";

const METHODS: { value: LiveContactMethod; label: string }[] = [
  { value: "phone_live", label: "Live phone call" },
  { value: "video_live", label: "Live video call" },
  { value: "in_person", label: "In person" },
];

export function ComplianceActions({
  patientId,
  tcmDone,
  rpmLiveDone,
}: {
  patientId: string;
  tcmDone: boolean;
  rpmLiveDone: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [method, setMethod] = useState<LiveContactMethod>("phone_live");
  const [f2fDate, setF2fDate] = useState("");

  return (
    <div className="flex flex-col gap-2 mt-1 p-3 rounded-xl bg-muted-bg/60 border border-border/60">
      <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">Log a live clinician contact</div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as LiveContactMethod)}
          disabled={isPending}
          className="text-[12px] border border-border rounded-lg px-2 py-1.5 bg-surface"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={isPending || tcmDone}
          onClick={() => startTransition(() => recordTcmContact(patientId, method))}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-primary text-white disabled:opacity-40"
        >
          {tcmDone ? "TCM contact logged" : "Log TCM 2-day contact"}
        </button>
        <button
          type="button"
          disabled={isPending || rpmLiveDone}
          onClick={() => startTransition(() => recordRpmLiveContact(patientId, method))}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-primary text-white disabled:opacity-40"
        >
          {rpmLiveDone ? "RPM live contact logged" : "Log RPM live contact"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => logRpmDeviceDay(patientId))}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-surface border border-border disabled:opacity-40"
        >
          +1 RPM device day
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={f2fDate}
          onChange={(e) => setF2fDate(e.target.value)}
          disabled={isPending}
          className="text-[12px] border border-border rounded-lg px-2 py-1.5 bg-surface"
        />
        <button
          type="button"
          disabled={isPending || !f2fDate}
          onClick={() => startTransition(() => scheduleF2F(patientId, f2fDate))}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-surface border border-border disabled:opacity-40"
        >
          Set F2F visit date
        </button>
      </div>
    </div>
  );
}
