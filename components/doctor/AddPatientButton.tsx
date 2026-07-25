"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, ScanLine } from "lucide-react";
import { addPatient } from "@/lib/actions";

const CONDITIONS = ["HF", "COPD", "AMI", "Pneumonia"] as const;

const PARSE_STEPS = ["Reading letter…", "Checking medications…", "Checking for red flags…"];

export function AddPatientButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"manual" | "letter">("manual");
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

  function close() {
    setOpen(false);
    setMode("manual");
    setError(null);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface rounded-2xl border border-border p-5 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-heading font-bold text-[15px]">Onboard new patient</div>
              <button onClick={close} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-1 mb-4 p-1 rounded-[10px] bg-background border border-border">
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`flex-1 px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold transition-colors ${
                  mode === "manual" ? "bg-primary text-white" : "text-muted hover:text-foreground"
                }`}
              >
                Enter manually
              </button>
              <button
                type="button"
                onClick={() => setMode("letter")}
                className={`flex-1 px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold transition-colors ${
                  mode === "letter" ? "bg-primary text-white" : "text-muted hover:text-foreground"
                }`}
              >
                From discharge letter
              </button>
            </div>

            {mode === "manual" ? (
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
            ) : (
              <LetterUploadForm
                error={error}
                setError={setError}
                onParsed={(patientId) => {
                  setOpen(false);
                  router.push(`/doctor/${patientId}`);
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function LetterUploadForm({
  error,
  setError,
  onParsed,
}: {
  error: string | null;
  setError: (e: string | null) => void;
  onParsed: (patientId: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isParsing) return;
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, PARSE_STEPS.length - 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isParsing]);

  async function handleParse() {
    if (!file) {
      setError("Choose a photo of the discharge letter first.");
      return;
    }
    setError(null);
    setStepIndex(0);
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to parse the letter.");
      onParsed(body.patientId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse the letter.");
    } finally {
      setIsParsing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex flex-col items-center justify-center gap-2 px-3 py-6 rounded-[10px] border-2 border-dashed border-border bg-background text-center cursor-pointer hover:border-primary/50 transition-colors">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Discharge letter preview" className="max-h-40 rounded-[6px] object-contain" />
        ) : (
          <>
            <ScanLine size={22} className="text-muted" />
            <span className="text-[12.5px] text-muted">Tap to photograph or upload the discharge letter</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {isParsing && (
        <div className="text-[12.5px] text-muted text-center py-1">{PARSE_STEPS[stepIndex]}</div>
      )}

      {error && <div className="text-[12.5px] text-critical">{error}</div>}

      <button
        type="button"
        onClick={handleParse}
        disabled={isParsing || !file}
        className="mt-1 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isParsing ? "Parsing…" : "Parse letter & onboard patient"}
      </button>
    </div>
  );
}
