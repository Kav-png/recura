import { Card } from "./Card";

type Medication = {
  id: string;
  name: string;
  dose: string | null;
  frequency: string | null;
  status: string;
  reason: string | null;
};

const STATUS_ORDER = ["new", "changed", "stopped", "unchanged"];

const STATUS_COPY: Record<string, { verb: string; accent: string }> = {
  new: { verb: "You started a new medication", accent: "border-l-primary" },
  changed: { verb: "This medication changed", accent: "border-l-warning" },
  stopped: { verb: "You stopped this medication", accent: "border-l-critical" },
  unchanged: { verb: "Continuing as before", accent: "border-l-stable" },
};

export function MedicationsCard({ medications }: { medications: Medication[] }) {
  const sorted = [...medications].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );

  return (
    <Card title="Your medications" subtitle="In plain English, from your discharge letter">
      {sorted.length === 0 ? (
        <p className="text-sm text-muted">No medications on file yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((m) => {
            const copy = STATUS_COPY[m.status] ?? STATUS_COPY.unchanged;
            const details = [m.dose, m.frequency].filter(Boolean).join(", ");
            return (
              <div key={m.id} className={`border-l-4 ${copy.accent} bg-muted-bg/60 rounded-r-2xl px-4 py-3.5`}>
                <div className="text-[12.5px] font-semibold text-muted uppercase tracking-wide">{copy.verb}</div>
                <div className="font-heading font-bold text-[16px] mt-1">
                  {m.name}
                  {details ? <span className="font-sans font-normal text-[14px] text-muted"> — {details}</span> : null}
                </div>
                {m.reason && <p className="text-[14px] text-foreground/80 mt-1.5 leading-snug">{m.reason}</p>}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted mt-4 leading-relaxed">
        Always check with your pharmacist or GP before changing how you take any medicine.
      </p>
    </Card>
  );
}
