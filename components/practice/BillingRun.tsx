import { PrintButton, BackButton } from "@/components/doctor/PrintButton";
import type { BillingRunDoc, BillingRunRow } from "@/lib/billingDocument";

export function BillingRun({ doc }: { doc: BillingRunDoc }) {
  const generated = new Date(doc.generatedAt).toLocaleString("en-US");
  const readyRows = doc.rows.filter((r) => r.status === "captured");
  const pendingRows = doc.rows.filter((r) => r.status !== "captured");

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10 print:p-0 bg-background text-foreground min-h-screen">
      <div className="print:hidden mb-6 flex items-center justify-between">
        <BackButton href="/practice" />
        <PrintButton />
      </div>

      <div className="border border-border rounded-2xl p-6 sm:p-8 bg-surface">
        <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
          <div>
            <div className="font-heading font-extrabold text-lg">{doc.practiceName}</div>
            <div className="text-[12px] text-muted">Billing Run — Ready to Submit</div>
          </div>
          <div className="text-right text-[11px] text-muted">Generated {generated}</div>
        </div>

        <RunSection title={`Ready to submit (${readyRows.length})`} rows={readyRows} total={doc.readyTotal} />
        <RunSection title={`Pending — not yet billable (${pendingRows.length})`} rows={pendingRows} total={doc.pendingTotal} muted />

        <div className="text-[11px] text-muted border-t border-border pt-3 mt-4 leading-relaxed">
          Each &ldquo;ready to submit&rdquo; row traces to a clinician-logged live TCM/RPM contact — open a patient&rsquo;s
          own billing document for the full attestation and diagnosis detail. Verify final coding before claim submission.
        </div>
      </div>
    </div>
  );
}

function RunSection({ title, rows, total, muted }: { title: string; rows: BillingRunRow[]; total: number; muted?: boolean }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="font-heading font-bold text-[13px]">{title}</div>
        <div className={`font-heading font-bold text-[13px] ${muted ? "text-muted" : ""}`}>${total.toFixed(2)}</div>
      </div>
      <table className="w-full text-[12.5px] border-collapse">
        <thead>
          <tr className="text-left text-[10.5px] text-muted uppercase tracking-wide border-b border-border">
            <th className="py-1.5 pr-2">Patient</th>
            <th className="py-1.5 pr-2">Clinician</th>
            <th className="py-1.5 pr-2">CPT</th>
            <th className="py-1.5 pr-2">Dx</th>
            <th className="py-1.5 text-right">Charge</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="py-3 text-muted text-center">
                None.
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              <td className="py-1.5 pr-2">{r.patientName}</td>
              <td className="py-1.5 pr-2">{r.clinicianName}</td>
              <td className="py-1.5 pr-2 font-semibold">{r.code}</td>
              <td className="py-1.5 pr-2">{r.dx}</td>
              <td className="py-1.5 text-right">${r.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
