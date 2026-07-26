"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { removePatient } from "@/lib/actions";

export function RemovePatientButton({ patientId, patientName }: { patientId: string; patientName: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      try {
        await removePatient(patientId);
        setOpen(false);
        router.push("/doctor");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to remove patient.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Remove patient"
        className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-[10px] text-critical hover:bg-critical-bg transition-colors shrink-0"
      >
        <Trash2 size={14} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => !isPending && setOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm surface-strong rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-heading font-bold text-[15px]">Remove patient?</div>
              <button onClick={() => !isPending && setOpen(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <p className="text-[13px] text-muted mb-4">
              This permanently deletes <span className="font-semibold text-foreground">{patientName}</span> — medications, red
              flags, check-ins, alerts, and billing history included. This can&apos;t be undone.
            </p>

            {error && <div className="text-[12.5px] text-critical mb-3">{error}</div>}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="text-[12.5px] font-semibold px-3.5 py-2 rounded-[10px] bg-muted-bg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={isPending}
                className="text-[12.5px] font-semibold px-3.5 py-2 rounded-[10px] bg-critical text-white disabled:opacity-50"
              >
                {isPending ? "Removing…" : "Remove patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
