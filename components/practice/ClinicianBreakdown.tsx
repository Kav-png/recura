type ClinicianRow = {
  id: string;
  name: string;
  role: string;
  specialty: string | null;
  patientCount: number;
  capturedBilling: number;
};

export function ClinicianBreakdown({ rows }: { rows: ClinicianRow[] }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
      <div className="font-heading font-bold text-[15px] mb-3.5">Per-Clinician Breakdown</div>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm min-w-[440px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="font-semibold pb-2 px-1">Clinician</th>
              <th className="font-semibold pb-2 px-1">Patients enrolled</th>
              <th className="font-semibold pb-2 px-1 text-right">Billing captured</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/60">
                <td className="py-2.5 px-1">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-muted capitalize">
                    {r.role}
                    {r.specialty ? ` · ${r.specialty}` : ""}
                  </div>
                </td>
                <td className="py-2.5 px-1">{r.patientCount}</td>
                <td className="py-2.5 px-1 text-right font-semibold">${r.capturedBilling.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
