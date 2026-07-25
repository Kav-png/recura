import { StatCard } from "@/components/practice/StatCard";
import { HRRP_AVG_PENALTY } from "@/lib/practiceMetrics";

export function RoiOverview({
  capturedBilling,
  pendingBilling,
  estimatedReadmissionsAvoided,
  estimatedCostAvoided,
}: {
  capturedBilling: number;
  pendingBilling: number;
  estimatedReadmissionsAvoided: number;
  estimatedCostAvoided: number;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
      <div className="font-heading font-bold text-[15px] mb-1">Return on Investment</div>
      <div className="text-[12.5px] text-muted mb-3.5 leading-relaxed">
        What this program is billing and is estimated to be saving this practice, based on the current enrolled
        patient panel.
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Billing captured"
          value={`$${capturedBilling.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          unit="this period"
          color="bg-stable"
          note={pendingBilling > 0 ? `+$${pendingBilling.toLocaleString(undefined, { maximumFractionDigits: 0 })} pending` : "TCM + RPM codes, current period"}
        />
        <StatCard
          label="Est. readmissions avoided"
          value={estimatedReadmissionsAvoided.toFixed(1)}
          unit="episodes"
          color="bg-primary"
          note="Illustrative estimate — modeled from HF/COPD baseline 30-day readmission rates x a 21% pooled risk reduction from published post-discharge follow-up evidence, applied to the current panel. Not a measured outcome of this tool."
        />
        <StatCard
          label="Est. cost avoided"
          value={`$${Math.round(estimatedCostAvoided).toLocaleString()}`}
          unit="illustrative"
          color="bg-primary"
          note="HF $2,488 / general $2,140 avoidable-cost-per-avoided-readmission, applied to the modeled estimate above — never the $13-15K gross readmission cost."
        />
        <StatCard
          label="HRRP penalty exposure"
          value={`$${(HRRP_AVG_PENALTY / 1000).toFixed(0)}K`}
          unit="avg / hospital"
          color="bg-warning"
          note="FY2024 national average penalty for penalized hospitals — context for the risk this program addresses, not a computed reduction for this practice."
        />
      </div>
    </div>
  );
}
