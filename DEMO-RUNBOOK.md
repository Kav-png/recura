# Demo Runbook

Click-by-click order for the ~1 minute demo spine. Written for Block H (freeze + dress rehearsal) — see [MASTER-PLAN.md](MASTER-PLAN.md) for the product narrative and [blocks/BLOCK-H-freeze-rehearsal.md](blocks/BLOCK-H-freeze-rehearsal.md) for the freeze checklist this supports.

## Before you start

1. Reset demo data: `/settings` → log in as `maria.alvarez@demo.recura.health` (admin — required, see README's "Access control & audit trail") → "Reload demo data". Confirms 10 clean demo patients, no leftover test data from the last rehearsal.
2. Confirm env vars are set (locally `.env.local`, on the deployed link Vercel project settings): `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — the live letter parse and real-patient paths silently no-op without them.
3. Pre-open three tabs, in this order: `/doctor` (clinician console, logged in as Dr. Alvarez), `/practice` (ROI dashboard), `/patient/[id]` for whichever demo patient you'll use as the portal example.
4. Have the printed copy of `prebuild/letter-1-hf.html` in hand.
5. Backup video ready on a second device, in case the live parse or call needs to be skipped (see "If something breaks" below).
6. Phone/laptop >80% battery, volume up, DND off.

## Click-by-click

1. **`/doctor`** → "New patient" → "From discharge letter" → photograph the printed `letter-1-hf.html`.
2. Live parse returns → red flag visible on the new patient's detail page immediately.
3. On the patient detail page → "Start check-in call" (WebRTC browser call by default — no telephony setup needed; see "Real call vs. browser call" below if dialing an actual phone).
4. Give a red-flag answer during the call (e.g. describe the weight-gain/breathlessness threshold the letter's red flag names).
5. Switch to the Alerts panel (same `/doctor` tab, or the sticky rail) — the alert appears live, no refresh needed.
6. Click the alert → "Bring them in" (or the equivalent review action) — this is the clinician decision the product exists to support.
7. Switch to **`/practice`** tab → the captured-billing number has moved.
8. Optionally switch to **`/patient/[id]`** tab to show the plain-English portal view of the same patient.

## Real call vs. browser call

Default: WebRTC call straight from the doctor's browser (`components/doctor/CheckinCallButton.tsx`) — always works, no phone/hotspot needed, this is the safe default for stage.

If dialing an actual patient phone for effect: needs `ELEVENLABS_PHONE_NUMBER_ID` provisioned and a real network — use a phone hotspot, not venue wifi, since ElevenLabs' outbound call audio is sensitive to venue wifi latency/NAT. If hotspot audio is unreliable in rehearsal, fall back to the browser call — this is an accepted fallback per Block B, not a degraded demo.

## Reset command

`/settings` → "Reload demo data" (admin login required). Wipes everything with `is_demo=true` and reseeds from `lib/demoData.ts` — patients, meds, red flags, check-in history, alerts, billing, both clinicians' auth accounts. Run this between every rehearsal so reviewed alerts don't carry over into the next run, and once more right before the final freeze.

## If something breaks in rehearsal

Fix ONLY the broken link, smallest change, one full re-run, re-freeze. Unfixable in 20 minutes → that beat switches to the backup video with confident narration instead of debugging live.

If the live letter-parse call specifically is what's flaky (network, API latency on stage): fall back to a second, already-parsed demo patient sitting in the seeded data — narrate "here's one I ran through this same flow earlier" rather than risk a live API call failing mid-pitch.
