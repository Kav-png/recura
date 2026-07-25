export function EnrollmentFunnel({
  enrolled,
  tcmDone,
  rpmReporting,
  byCondition,
}: {
  enrolled: number;
  tcmDone: number;
  rpmReporting: number;
  byCondition: { HF: number; COPD: number };
}) {
  const stages = [
    { label: "Enrolled", value: enrolled },
    { label: "TCM 2-day contact done", value: tcmDone },
    { label: "RPM reporting this period", value: rpmReporting },
  ];
  const max = enrolled || 1;

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
      <div className="font-heading font-bold text-[15px] mb-1">Enrollment &amp; Care Funnel</div>
      <div className="text-[12px] text-muted mb-3.5 leading-relaxed">
        Real counts from the current patient panel — no illustrative &quot;offered&quot; stage is modeled since that
        isn&apos;t data the schema tracks.
      </div>
      <div className="flex flex-col gap-2.5">
        {stages.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between text-[13px] mb-1">
              <span className="font-semibold">{s.label}</span>
              <span className="text-muted">
                {s.value} / {enrolled}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted-bg overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${(s.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 sm:gap-6 mt-4 pt-3.5 border-t border-border/60 text-[12.5px]">
        <div>
          <span className="font-semibold">{byCondition.HF}</span> <span className="text-muted">HF enrolled</span>
        </div>
        <div>
          <span className="font-semibold">{byCondition.COPD}</span> <span className="text-muted">COPD enrolled</span>
        </div>
      </div>
    </div>
  );
}
