"use client";

import { useState, useTransition } from "react";
import {
  recordTcmContact,
  recordTcmMedReconciliation,
  recordTcmMdmLevel,
  recordRpmLiveContact,
  logRpmDeviceDay,
  scheduleF2F,
  type LiveContactMethod,
  type TcmMdmLevel,
} from "@/lib/actions";

const METHODS: { value: LiveContactMethod; label: string }[] = [
  { value: "phone_live", label: "Live phone call" },
  { value: "video_live", label: "Live video call" },
  { value: "in_person", label: "In person" },
];

const MDM_LEVELS: { value: TcmMdmLevel; label: string }[] = [
  { value: "moderate", label: "Moderate complexity (→ 99495)" },
  { value: "high", label: "High complexity (→ 99496)" },
];

export function ComplianceActions({
  patientId,
  tcmDone,
  tcmMedReconDone,
  tcmMdmLevel,
  rpmLiveDone,
}: {
  patientId: string;
  tcmDone: boolean;
  tcmMedReconDone: boolean;
  tcmMdmLevel: string | null;
  rpmLiveDone: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [method, setMethod] = useState<LiveContactMethod>("phone_live");
  const [f2fDate, setF2fDate] = useState("");
  const [mdmLevel, setMdmLevel] = useState<TcmMdmLevel>((tcmMdmLevel as TcmMdmLevel) ?? "moderate");
  const [rpmMinutes, setRpmMinutes] = useState(20);

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
        <input
          type="number"
          min={0}
          max={120}
          value={rpmMinutes}
          onChange={(e) => setRpmMinutes(Number(e.target.value))}
          disabled={isPending}
          title="Minutes of live RPM communication (≥20 bills 99457, 10-19 bills 99470)"
          className="w-16 text-[12px] border border-border rounded-lg px-2 py-1.5 bg-surface"
        />
        <button
          type="button"
          disabled={isPending || rpmLiveDone}
          onClick={() => startTransition(() => recordRpmLiveContact(patientId, method, rpmMinutes))}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-primary text-white disabled:opacity-40"
        >
          {rpmLiveDone ? "RPM live contact logged" : "Log RPM live contact (min)"}
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
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={mdmLevel}
          onChange={(e) => setMdmLevel(e.target.value as TcmMdmLevel)}
          disabled={isPending}
          className="text-[12px] border border-border rounded-lg px-2 py-1.5 bg-surface"
        >
          {MDM_LEVELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => recordTcmMdmLevel(patientId, mdmLevel))}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-surface border border-border disabled:opacity-40"
        >
          {tcmMdmLevel ? "Update MDM complexity" : "Log MDM complexity"}
        </button>
        <button
          type="button"
          disabled={isPending || tcmMedReconDone}
          onClick={() => startTransition(() => recordTcmMedReconciliation(patientId))}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-surface border border-border disabled:opacity-40"
        >
          {tcmMedReconDone ? "Med reconciliation logged" : "Log medication reconciliation"}
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
