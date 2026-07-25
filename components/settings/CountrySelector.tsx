"use client";

import { useTransition } from "react";
import { setPracticeCountry } from "@/lib/actions";
import { COUNTRIES, emergencyNumberFor, isCountryCode, type CountryCode } from "@/lib/emergency";

export function CountrySelector({ country }: { country: CountryCode }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <div className="font-heading font-bold text-[15px] mb-1.5">Practice region</div>
      <div className="text-[13px] text-muted mb-4 leading-relaxed">
        {`Drives the emergency number quoted in real-time alerts and the patient portal (e.g. "call ${emergencyNumberFor(country)} now"). Historical check-in transcripts already on file keep the number that was current when they were recorded.`}
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.entries(COUNTRIES) as [CountryCode, (typeof COUNTRIES)[CountryCode]][]).map(([code, meta]) => (
          <button
            key={code}
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!isCountryCode(code)) return;
              startTransition(() => setPracticeCountry(code));
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] border text-[13px] font-semibold transition-colors disabled:opacity-50 ${
              country === code ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface hover:bg-muted-bg"
            }`}
          >
            <span className="text-base" aria-hidden="true">
              {meta.flag}
            </span>
            {meta.name}
            <span className="text-muted font-normal">&middot; {meta.emergencyNumber}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
