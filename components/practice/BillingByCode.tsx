const CODE_LABELS: Record<string, string> = {
  "99495": "TCM — moderate complexity (2-day contact)",
  "99496": "TCM — high complexity (2-day contact)",
  "99445": "RPM device supply (2–15 days data)",
  "99454": "RPM device supply (16+ days data)",
  "99470": "RPM management, first 10 min",
};

type BillingCodeRow = {
  code: string;
  capturedCount: number;
  capturedAmount: number;
  pendingCount: number;
  pendingAmount: number;
};

export function BillingByCode({ rows }: { rows: BillingCodeRow[] }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3.5">
        <div className="font-heading font-bold text-[15px]">Billing Status by CPT Code</div>
        <a href="/practice/billing" target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-primary hover:underline">
          Export billing run →
        </a>
      </div>
      <div className="flex flex-col">
        {rows.map((r) => (
          <div key={r.code} className="py-2.5 border-b border-border/60 last:border-0">
            <div className="mb-1.5 min-w-0">
              <div className="text-sm font-semibold truncate">{CODE_LABELS[r.code] ?? r.code}</div>
              <div className="text-xs text-muted">CPT {r.code}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[12.5px]">
              <span className="px-2.5 py-1 rounded-full bg-stable-bg text-stable font-semibold">
                {r.capturedCount} captured &middot; ${r.capturedAmount.toFixed(0)}
              </span>
              {r.pendingCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-warning-bg text-warning font-semibold">
                  {r.pendingCount} pending &middot; ${r.pendingAmount.toFixed(0)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
