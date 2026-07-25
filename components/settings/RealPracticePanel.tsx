"use client";

import { useState, useTransition } from "react";
import { createRealPractice, enrollPatient, type RealPracticeInput, type RealPatientInput } from "@/lib/patientEnrollment";

type RealPractice = {
  id: string;
  name: string;
  clinicians: { id: string; name: string; role: string }[];
};

export function RealPracticePanel({ practices }: { practices: RealPractice[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handlePracticeSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    const input: RealPracticeInput = {
      practiceName: String(formData.get("practiceName") ?? "").trim(),
      clinicianName: String(formData.get("clinicianName") ?? "").trim(),
      clinicianRole: (formData.get("clinicianRole") as "physician" | "nurse") ?? "physician",
    };
    if (!input.practiceName || !input.clinicianName) {
      setError("Practice name and clinician name are required.");
      return;
    }
    startTransition(async () => {
      try {
        await createRealPractice(input);
        setMessage(`Created real practice "${input.practiceName}" with clinician ${input.clinicianName}.`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create practice.");
      }
    });
  }

  function handlePatientSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    const input: RealPatientInput = {
      practiceId: String(formData.get("practiceId") ?? ""),
      clinicianId: String(formData.get("clinicianId") ?? ""),
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      condition: (formData.get("condition") as "HF" | "COPD") ?? "HF",
      dischargeDate: String(formData.get("dischargeDate") ?? ""),
      consentGranted: formData.get("consentGranted") === "on",
    };
    if (!input.practiceId || !input.clinicianId || !input.name || !input.dischargeDate) {
      setError("Practice, clinician, name, and discharge date are required.");
      return;
    }
    if (!input.consentGranted) {
      setError("Consent must be captured before a real patient can be enrolled.");
      return;
    }
    startTransition(async () => {
      try {
        const patient = await enrollPatient(input);
        setMessage(`Enrolled ${patient.name} (is_demo=false).`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to enroll patient.");
      }
    });
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 mb-5">
      <div className="font-heading font-bold text-[15px] mb-1.5">Real (non-demo) practice</div>
      <div className="text-[13px] text-muted mb-4 leading-relaxed">
        Separate from demo data — never touched by &quot;Reload demo patients&quot;. Rows created here are
        <code className="mx-1 px-1 py-0.5 rounded bg-background text-[11.5px]">is_demo=false</code>
        and only reachable via the service-role key, not the anon key used by the rest of this app.
      </div>

      <form action={handlePracticeSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <input name="practiceName" placeholder="Practice name" className="col-span-1 px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]" />
        <input name="clinicianName" placeholder="Clinician name" className="col-span-1 px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]" />
        <select name="clinicianRole" className="col-span-1 px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]">
          <option value="physician">Physician</option>
          <option value="nurse">Nurse</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="sm:col-span-3 justify-self-start px-4 py-2 rounded-[10px] border border-border text-[13px] font-semibold hover:bg-background transition-colors disabled:opacity-50"
        >
          Create real practice + clinician
        </button>
      </form>

      {practices.length > 0 && (
        <form action={handlePatientSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-border pt-4">
          <select name="practiceId" className="px-3 py-2 rounded-[8px] border border-border bg-background text-[13px] col-span-1">
            <option value="">Select real practice…</option>
            {practices.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select name="clinicianId" className="px-3 py-2 rounded-[8px] border border-border bg-background text-[13px] col-span-1">
            <option value="">Select clinician…</option>
            {practices.flatMap((p) => p.clinicians).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="name" placeholder="Patient name" className="px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]" />
          <input name="phone" placeholder="Phone (+1...)" className="px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]" />
          <select name="condition" className="px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]">
            <option value="HF">Heart failure (HF)</option>
            <option value="COPD">COPD</option>
          </select>
          <input name="dischargeDate" type="date" className="px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]" />
          <label className="sm:col-span-2 flex items-center gap-2 text-[12.5px] text-muted">
            <input type="checkbox" name="consentGranted" />
            Consent for automated check-in calls captured at enrollment (required — TCPA)
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="sm:col-span-2 justify-self-start px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Enroll real patient"}
          </button>
        </form>
      )}

      {message && <div className="text-[12.5px] text-stable mt-3">{message}</div>}
      {error && <div className="text-[12.5px] text-critical mt-3">{error}</div>}
    </div>
  );
}
