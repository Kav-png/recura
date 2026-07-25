import Link from "next/link";

export function Schedule({
  items,
}: {
  items: { patientId: string; patientName: string; nextCheckin: Date | null }[];
}) {
  return (
    <div className="surface rounded-2xl p-4 sm:p-5">
      <div className="font-heading font-bold text-[15px] mb-3.5">Upcoming Check-in Calls</div>
      <div className="flex flex-col gap-3.5">
        {items.map((s) => (
          <Link key={s.patientId} href={`/doctor/${s.patientId}`} className="flex gap-3 group">
            <div className="text-xs font-bold text-muted w-14 shrink-0 pt-0.5">
              {s.nextCheckin?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="flex-1 pb-3 border-b border-border/70">
              <div className="text-[13.5px] font-semibold group-hover:text-primary">{s.patientName}</div>
              <div className="text-xs text-muted mt-0.5">Daily voice check-in</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
