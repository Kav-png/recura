"use client";

import { useEffect, useMemo, useState } from "react";
import { ScanLine, FileText } from "lucide-react";

const PARSE_STEPS = ["Reading letter…", "Checking medications…", "Checking for red flags…"];

export function LetterUploadForm({
  patientId,
  error,
  setError,
  onParsed,
}: {
  /** When set, the parsed letter is reconciled into this existing patient instead of creating a new one. */
  patientId?: string;
  error: string | null;
  setError: (e: string | null) => void;
  onParsed: (patientId: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const isImageFile = file?.type.startsWith("image/") ?? false;
  const previewUrl = useMemo(() => (file && isImageFile ? URL.createObjectURL(file) : null), [file, isImageFile]);
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
      if (patientId) formData.set("patientId", patientId);
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
      {patientId && (
        <div className="text-[12px] text-muted bg-muted-bg px-3 py-2 rounded-[8px]">
          Existing medications, allergies, and history are kept — this only adds what&apos;s new in the letter and updates
          anything it says has changed.
        </div>
      )}
      <label className="flex flex-col items-center justify-center gap-2 px-3 py-6 rounded-[10px] border-2 border-dashed border-border bg-background text-center cursor-pointer hover:border-primary/50 transition-colors">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Discharge letter preview" className="max-h-40 rounded-[6px] object-contain" />
        ) : file ? (
          <>
            <FileText size={22} className="text-muted" />
            <span className="text-[12.5px] text-muted">{file.name}</span>
          </>
        ) : (
          <>
            <ScanLine size={22} className="text-muted" />
            <span className="text-[12.5px] text-muted">Tap to photograph or upload the discharge letter (image or PDF)</span>
          </>
        )}
        <input
          type="file"
          accept="image/*,application/pdf"
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
        {isParsing ? "Parsing…" : patientId ? "Parse letter & update patient" : "Parse letter & onboard patient"}
      </button>
    </div>
  );
}
