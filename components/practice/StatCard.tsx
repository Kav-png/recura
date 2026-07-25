export function StatCard({
  label,
  value,
  unit,
  color,
  note,
}: {
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  note?: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-4.5 flex flex-col">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="text-[11px] sm:text-xs text-muted font-semibold uppercase tracking-wide">{label}</div>
        <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
      </div>
      <div className="font-heading font-extrabold text-xl sm:text-2xl">
        {value}
        {unit ? <span className="text-[12px] sm:text-[13px] font-semibold text-muted"> {unit}</span> : null}
      </div>
      {note ? <div className="text-[11px] text-muted mt-1.5 leading-snug">{note}</div> : null}
    </div>
  );
}
