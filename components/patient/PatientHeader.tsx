import { daysSince } from "@/lib/status";
import { CONDITION_LABELS } from "./copy";

export function PatientHeader({
  name,
  dischargeDate,
  condition,
}: {
  name: string;
  dischargeDate: string;
  condition: string;
}) {
  const firstName = name.split(" ")[0];
  const days = Math.max(daysSince(dischargeDate), 0);
  const dayLabel = days === 0 ? "your first day home" : `day ${days} of your recovery`;
  const conditionLabel = CONDITION_LABELS[condition] ?? condition;

  return (
    <div className="text-center sm:text-left px-1">
      <div className="text-sm text-muted font-semibold">Hello, {firstName}</div>
      <h1 className="font-heading font-extrabold text-[26px] sm:text-3xl mt-1 leading-tight">
        You&rsquo;re on {dayLabel}
      </h1>
      <p className="text-[15px] text-muted mt-2 leading-relaxed max-w-md mx-auto sm:mx-0">
        Recovering from {conditionLabel}. This page helps you keep track of your medicines and how you&rsquo;ve been
        feeling — your care team is always the ones looking after you.
      </p>
    </div>
  );
}
