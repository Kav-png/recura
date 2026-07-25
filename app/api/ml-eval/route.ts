import { NextResponse } from "next/server";
import { trainAndEvaluateOnSyntheticCohort } from "@/lib/mlRisk";

// Demo-slide endpoint: trains the V1.5 deterioration-risk model on a synthetic wearable
// cohort (see lib/mlRisk.ts) and returns held-out precision/recall. Always synthetic —
// never wire real patient data through this until V2 has accumulated confirm/dismiss labels.
export async function GET() {
  try {
    const { metrics } = trainAndEvaluateOnSyntheticCohort();
    return NextResponse.json({ ...metrics, dataset: "synthetic" });
  } catch (err) {
    console.error("ml-eval failed", err);
    return NextResponse.json({ error: "ml-eval failed" }, { status: 500 });
  }
}
