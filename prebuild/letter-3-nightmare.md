# Letter 3 — nightmare stress test (never demo unless perfect)

Purpose: probe failure modes. Recreate by printing letter-1-hf.html, then: photograph at an angle in poor light, add handwritten annotation in biro ("stopped ibuprofen — verbal, 17/7" scrawled in margin), fold it twice, photograph the creased result.

What good behaviour looks like:
- Illegible fields → null, never hallucinated doses
- The handwritten "stopped ibuprofen" note: ideally detected → ibuprofen status "stopped" + an INFO flag noting a handwritten amendment that should be confirmed with the GP. Missing the handwriting entirely is acceptable; inventing content is not.
- If parse confidence collapses, the correct output is fewer, accurate medications — not a complete confident-looking guess.

Log results in the notebook Thursday; adjust prompt rule 1 wording if hallucination appears.
