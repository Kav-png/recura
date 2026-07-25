import { AlertTriangle, Info } from "lucide-react";
import { Card } from "./Card";

type RedFlag = {
  id: string;
  severity: string;
  title: string;
  explanation_plain_english: string;
  source: string;
};

// Severity styling is deliberately muted for info/warn — CLAUDE.md's safety rail says the
// system never reassures or diagnoses, it just notices and explains, so nothing here should
// read as an alarm unless severity is "danger".
export function WatchForCard({ redFlags }: { redFlags: RedFlag[] }) {
  if (redFlags.length === 0) return null;

  return (
    <Card title="Things to keep an eye on" subtitle="From your discharge letter and check-ins">
      <div className="flex flex-col gap-3">
        {redFlags.map((f) => {
          const isDanger = f.severity === "danger";
          return (
            <div key={f.id} className={`rounded-2xl px-4 py-3.5 ${isDanger ? "bg-critical-bg" : "bg-muted-bg/70"}`}>
              <div className="flex items-center gap-2">
                {isDanger ? (
                  <AlertTriangle size={16} className="text-critical shrink-0" aria-hidden="true" />
                ) : (
                  <Info size={16} className="text-muted shrink-0" aria-hidden="true" />
                )}
                <div className={`font-heading font-bold text-[15px] ${isDanger ? "text-critical" : ""}`}>{f.title}</div>
              </div>
              <p className="text-[14px] text-foreground/80 mt-1.5 leading-relaxed">{f.explanation_plain_english}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
