"use client";

import { useState, useTransition } from "react";
import { reloadDemoData } from "@/lib/demoData";

export function ReloadDemoDataButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <div>
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setResult(null);
            const res = await reloadDemoData();
            setResult(`Loaded ${res.patientCount} demo patients with fresh check-ins and call transcripts.`);
          })
        }
        className="px-4 py-2.5 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isPending ? "Loading demo data…" : "Reload demo patients & transcripts"}
      </button>
      {result && <div className="text-[12.5px] text-stable mt-2.5">{result}</div>}
    </div>
  );
}
