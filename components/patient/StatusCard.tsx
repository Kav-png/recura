import { Card } from "./Card";

// Framed as reassurance-about-process, not reassurance-about-symptoms — the app never tells
// the patient they're "fine"; it only says whether the care team has something open to review,
// per CLAUDE.md's hard safety rail ("notices, explains, escalates to humans").
export function StatusCard({ hasOpenAlerts, emergencyNumber }: { hasOpenAlerts: boolean; emergencyNumber: string }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${hasOpenAlerts ? "bg-warning" : "bg-stable"}`} />
        <div>
          {hasOpenAlerts ? (
            <>
              <div className="font-heading font-bold text-[16px]">
                Your care team is reviewing something from your last check-in
              </div>
              <p className="text-[14px] text-muted mt-1 leading-relaxed">
                {`They may be in touch soon. If you feel seriously unwell right now, call ${emergencyNumber} or your GP straightaway — don’t wait for a call back.`}
              </p>
            </>
          ) : (
            <>
              <div className="font-heading font-bold text-[16px]">Everything looks on track</div>
              <p className="text-[14px] text-muted mt-1 leading-relaxed">
                Your care team is here if you need anything.
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
