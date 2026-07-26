import { PrintButton, BackButton } from "@/components/doctor/PrintButton";
import type { SuperbillDoc } from "@/lib/billingDocument";

export function Superbill({ doc, patientId }: { doc: SuperbillDoc; patientId: string }) {
  const dos = new Date(doc.patient.discharge_date).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
  const generated = new Date(doc.generatedAt).toLocaleString("en-US");

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-10 print:p-0 bg-background text-foreground min-h-screen">
      <div className="print:hidden mb-6 flex items-center justify-between">
        <BackButton href={`/doctor/${patientId}`} />
        <PrintButton />
      </div>

      <div className="border border-border rounded-2xl p-6 sm:p-8 bg-surface">
        <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
          <div>
            <div className="font-heading font-extrabold text-lg">{doc.practice.name}</div>
            <div className="text-[12px] text-muted">Superbill / Billing Statement</div>
          </div>
          <div className="text-right text-[11px] text-muted">
            Generated {generated}
            <br />
            NPI on file
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-[13px] mb-5">
          <div>
            <div className="text-[11px] text-muted uppercase tracking-wide mb-0.5">Patient</div>
            <div className="font-semibold">{doc.patient.name}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted uppercase tracking-wide mb-0.5">Rendering clinician</div>
            <div className="font-semibold">
              {doc.clinician.name} <span className="text-muted capitalize font-normal">({doc.clinician.role})</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted uppercase tracking-wide mb-0.5">Date of discharge / service start</div>
            <div className="font-semibold">{dos}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted uppercase tracking-wide mb-0.5">Diagnosis (ICD-10)</div>
            <div className="font-semibold">
              {doc.dx.code} — {doc.dx.label}
            </div>
          </div>
        </div>

        <table className="w-full text-[13px] border-collapse mb-5">
          <thead>
            <tr className="text-left text-[11px] text-muted uppercase tracking-wide border-b border-border">
              <th className="py-2 pr-2">CPT</th>
              <th className="py-2 pr-2">Description</th>
              <th className="py-2 pr-2">Dx pointer</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 text-right">Charge</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-muted text-center">
                  No billable events logged yet for this episode.
                </td>
              </tr>
            )}
            {doc.lines.map((l, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="py-2 pr-2 font-semibold">{l.code}</td>
                <td className="py-2 pr-2">{l.label}</td>
                <td className="py-2 pr-2">{l.dx}</td>
                <td className="py-2 pr-2 capitalize">{l.status}</td>
                <td className="py-2 text-right">${l.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end gap-8 text-[13px] mb-6">
          <div>
            <div className="text-[11px] text-muted uppercase tracking-wide">Ready to submit</div>
            <div className="font-heading font-bold">${doc.capturedTotal.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted uppercase tracking-wide">Pending / not yet billable</div>
            <div className="font-heading font-bold">${doc.pendingTotal.toFixed(2)}</div>
          </div>
        </div>

        <div className="text-[11px] text-muted border-t border-border pt-3 leading-relaxed">
          Attestation: the TCM/RPM contacts reflected as &ldquo;captured&rdquo; above were performed via live,
          synchronous communication by the rendering clinician named, per CMS requirements — not by an automated
          assistant. Diagnosis code shown is an unspecified default; verify final coding before claim submission.
        </div>
      </div>
    </div>
  );
}
