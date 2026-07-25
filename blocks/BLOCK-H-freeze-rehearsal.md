# Block H — Freeze + Dress Rehearsal (Sun 10:30–11:50) ⏰ SUBMIT BY 11:50, deadline 12:00

**Rewritten 2026-07-25 for the institutional pivot — see MASTER-PLAN.md.** No family phone, no WhatsApp/Telegram send to confirm. The rehearsal is entirely inside the three product surfaces: doctor dashboard, practice overview, patient portal.

## CODE FREEZE 10:30. No exceptions.

## Checklist
- [ ] `/settings` → "Reload demo patients & transcripts" run; confirms 10 clean demo patients, no test data left over from rehearsal (verified working 2026-07-25 — wipes everything with `is_demo=true` and reseeds from `lib/demoData.ts`)
- [ ] Confirm `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are set (`.env.local` locally, Vercel env vars for the deployed link) — the live letter parse and real-patient paths silently no-op without them
- [ ] Two full dress rehearsals of the demo spine: printed copy of `prebuild/letter-1-hf.html` → live parse on `/doctor` → red flag visible on the new patient → Start check-in call → red-flag answer → Alerts panel updates live → "Bring them in" → `/practice`'s captured-billing number moves. Use actual phones/hotspot (not venue wifi) if the ElevenLabs call needs real audio on stage; browser-only call is an acceptable fallback per BLOCK-B if hotspot audio is unreliable.
- [ ] Tabs pre-opened in order: `/doctor` (clinician console), `/practice` (ROI dashboard), `/patient/[id]` (portal for the demo patient just parsed) — plus a backup video on a second device
- [ ] Phone/laptop >80% battery, volume up, DND off
- [ ] DEMO-RUNBOOK.md — does not exist yet as of this rewrite; if there's time before freeze, write the click-by-click order + hotspot details + reset command into one, otherwise rely on this checklist plus the pre-opened tabs
- [ ] Eat something — judging runs 12:00–2:00, you may pitch late in the window
- [ ] 11:40: stop rehearsing. SUBMIT BY 11:50 — ten minutes of buffer, not zero.

## If something breaks in rehearsal
Fix ONLY that link, smallest change, one full re-run, re-freeze. Unfixable in 20 min → that beat switches to backup video with confident narration. If the live letter-parse call specifically is what's flaky (network, API latency on stage), the fallback is a second pre-parsed patient already sitting in the seeded demo data — narrate "here's one I ran through this same flow earlier" rather than risk a live API call failing mid-pitch.
