"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Plus, Trash2 } from "lucide-react";
import { updatePatient, type MedicationInput } from "@/lib/actions";
import { LetterUploadForm } from "@/components/doctor/LetterUploadForm";

const CONDITIONS = ["HF", "COPD", "AMI", "Pneumonia"] as const;
const MED_STATUSES = ["new", "changed", "stopped", "unchanged"] as const;

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  condition: string;
  discharge_date: string;
  resuscitation_status: string | null;
  emergency_contact_name: string | null;
  follow_up_clinic: string | null;
};

type Medication = { id: string; name: string; dose: string | null; frequency: string | null; status: string; reason: string | null };

// A medication row being edited — same shape as MedicationInput but always carries a stable
// client-side key (existing DB id, or a generated one for rows the clinician just added).
type DraftMedication = MedicationInput & { key: string };

let nextKey = 0;

export function EditPatientButton({ patient, medications }: { patient: Patient; medications: Medication[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"details" | "letter">("details");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [meds, setMeds] = useState<DraftMedication[]>([]);
  const [removedMedicationIds, setRemovedMedicationIds] = useState<string[]>([]);

  function openModal() {
    setMeds(
      medications.map((m) => ({
        key: m.id,
        id: m.id,
        name: m.name,
        dose: m.dose,
        frequency: m.frequency,
        status: m.status as DraftMedication["status"],
        reason: m.reason,
      }))
    );
    setRemovedMedicationIds([]);
    setError(null);
    setMode("details");
    setOpen(true);
  }

  function updateMed(key: string, patch: Partial<DraftMedication>) {
    setMeds((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  }

  function addMed() {
    setMeds((prev) => [
      ...prev,
      { key: `new-${nextKey++}`, name: "", dose: null, frequency: null, status: "new", reason: null },
    ]);
  }

  function removeMed(key: string) {
    const med = meds.find((m) => m.key === key);
    if (med?.id) setRemovedMedicationIds((prev) => [...prev, med.id!]);
    setMeds((prev) => prev.filter((m) => m.key !== key));
  }

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
        await updatePatient(patient.id, {
          name,
          phone: String(formData.get("phone") ?? ""),
          condition: (formData.get("condition") as (typeof CONDITIONS)[number]) ?? "HF",
          dischargeDate,
          resuscitationStatus: String(formData.get("resuscitationStatus") ?? "") || null,
          emergencyContactName: String(formData.get("emergencyContactName") ?? "") || null,
          followUpClinic: String(formData.get("followUpClinic") ?? "") || null,
          medications: meds
            .filter((m) => m.name.trim())
            .map((m) => ({ id: m.id, name: m.name, dose: m.dose, frequency: m.frequency, status: m.status, reason: m.reason })),
          removedMedicationIds,
        });
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update patient.");
      }
    });
  }

  function close() {
    if (isPending) return;
    setOpen(false);
    setMode("details");
    setError(null);
  }

  return (
    <>
      <button
        onClick={openModal}
        title="Edit patient"
        className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-[10px] bg-muted-bg hover:opacity-90 transition-opacity shrink-0"
      >
        <Pencil size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={close}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg surface-strong rounded-2xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-heading font-bold text-[15px]">Edit {patient.name}</div>
              <button onClick={close} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-1 mb-4 p-1 rounded-[10px] bg-background border border-border">
              <button
                type="button"
                onClick={() => setMode("details")}
                className={`flex-1 px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold transition-colors ${
                  mode === "details" ? "bg-primary text-white" : "text-muted hover:text-foreground"
                }`}
              >
                Edit details
              </button>
              <button
                type="button"
                onClick={() => setMode("letter")}
                className={`flex-1 px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold transition-colors ${
                  mode === "letter" ? "bg-primary text-white" : "text-muted hover:text-foreground"
                }`}
              >
                Update from new letter
              </button>
            </div>

            {mode === "details" ? (
              <form action={handleSubmit} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    name="name"
                    defaultValue={patient.name}
                    placeholder="Patient name"
                    required
                    className="sm:col-span-2 px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]"
                  />
                  <input
                    name="phone"
                    defaultValue={patient.phone ?? ""}
                    placeholder="Phone (+1...)"
                    className="px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]"
                  />
                  <select
                    name="condition"
                    defaultValue={patient.condition}
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
                      defaultValue={patient.discharge_date}
                      className="mt-1 w-full px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]"
                    />
                  </label>
                  <input
                    name="resuscitationStatus"
                    defaultValue={patient.resuscitation_status ?? ""}
                    placeholder="Resuscitation status"
                    className="px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]"
                  />
                  <input
                    name="emergencyContactName"
                    defaultValue={patient.emergency_contact_name ?? ""}
                    placeholder="Emergency contact"
                    className="px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]"
                  />
                  <input
                    name="followUpClinic"
                    defaultValue={patient.follow_up_clinic ?? ""}
                    placeholder="Follow-up clinic"
                    className="sm:col-span-2 px-3 py-2 rounded-[8px] border border-border bg-background text-[13px]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[12.5px] font-semibold text-muted">Medications</div>
                    <button
                      type="button"
                      onClick={addMed}
                      className="flex items-center gap-1 text-[12px] font-semibold text-primary"
                    >
                      <Plus size={13} />
                      Add medication
                    </button>
                  </div>
                  {meds.length === 0 && <div className="text-[12.5px] text-muted">No medications on file.</div>}
                  {meds.map((m) => (
                    <div key={m.key} className="flex flex-col gap-1.5 p-2.5 rounded-[8px] border border-border/70 bg-background">
                      <div className="flex gap-1.5">
                        <input
                          value={m.name}
                          onChange={(e) => updateMed(m.key, { name: e.target.value })}
                          placeholder="Medication name"
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-[12.5px]"
                        />
                        <button
                          type="button"
                          onClick={() => removeMed(m.key)}
                          title="Remove medication"
                          className="text-critical shrink-0 px-1.5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <input
                          value={m.dose ?? ""}
                          onChange={(e) => updateMed(m.key, { dose: e.target.value || null })}
                          placeholder="Dose"
                          className="px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-[12.5px]"
                        />
                        <input
                          value={m.frequency ?? ""}
                          onChange={(e) => updateMed(m.key, { frequency: e.target.value || null })}
                          placeholder="Frequency"
                          className="px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-[12.5px]"
                        />
                        <select
                          value={m.status}
                          onChange={(e) => updateMed(m.key, { status: e.target.value as DraftMedication["status"] })}
                          className="px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-[12.5px] capitalize"
                        >
                          {MED_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        value={m.reason ?? ""}
                        onChange={(e) => updateMed(m.key, { reason: e.target.value || null })}
                        placeholder="Reason (optional)"
                        className="px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-[12.5px]"
                      />
                    </div>
                  ))}
                </div>

                {error && <div className="text-[12.5px] text-critical">{error}</div>}

                <button
                  type="submit"
                  disabled={isPending}
                  className="mt-1 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save changes"}
                </button>
              </form>
            ) : (
              <LetterUploadForm
                patientId={patient.id}
                error={error}
                setError={setError}
                onParsed={() => {
                  setOpen(false);
                  router.refresh();
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
