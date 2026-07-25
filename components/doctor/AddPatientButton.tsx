"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { addPatient } from "@/lib/actions";

const CONDITIONS = ["HF", "COPD", "AMI", "Pneumonia"] as const;

export function AddPatientButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    const name = String(formData.get("name") ?? "").trim();
    const dischargeDate = String(formData.get("dischargeDate") ?? "");
    if (!name || !dischargeDate) {
      setError("Name and discharge date are required.");
      return;
    }
    startTransition(async () => {
      try {
        const patient = await addPatient({
          name,
          phone: String(formData.get("phone") ?? ""),
          condition: (formData.get("condition") as (typeof CONDITIONS)[number]) ?? "HF",
          dischargeDate,
        });
        setOpen(false);
        router.push(`/doctor/${patient.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add patient.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Onboard new patient"
        className="flex items-center gap-1.5 h-10 lg:h-11 px-3 lg:px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
      >
        <UserPlus size={16} />
        <span className="hidden sm:inline">New patient</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface rounded-2xl border border-border p-5 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-heading font-bold text-[15px]">Onboard new patient</div>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                name="name"
                placeholder="Patient name"
                required
                className="sm:col-span-2 px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]"
              />
              <input
                name="phone"
                placeholder="Phone (+1...)"
                className="px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]"
              />
              <select
                name="condition"
                className="px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <label className="sm:col-span-2 text-[12px] text-muted">
                Discharge date
                <input
                  name="dischargeDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="mt-1 w-full px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]"
                />
              </label>

              {error && <div className="sm:col-span-2 text-[12.5px] text-critical">{error}</div>}

              <button
                type="submit"
                disabled={isPending}
                className="sm:col-span-2 mt-1 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPending ? "Adding…" : "Add patient"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
