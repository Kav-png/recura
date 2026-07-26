# Block G — Pitch + Submission (Sun 09:00–10:30) ⏰ submissions due 12:00, judging 12:00–2:00

**Rewritten 2026-07-25 for the institutional pivot — see MASTER-PLAN.md.** The buyer is a physician group/hospital, not a patient's family; there is no WhatsApp/Telegram alert channel or `/family` view in this version. The three surfaces are the doctor/nurse dashboard, the practice ROI dashboard, and the patient portal.

## Objective
Submission text written, 3-minute pitch rehearsed 5x out loud, timed under 3:00.

## The demo spine (from CLAUDE.md — this is what's actually on stage)
Printed letter → live photo parse (`/doctor`'s "New patient → From discharge letter") → red flag shown on the newly-created patient → phone rings on stage (Start check-in call) → red-flag answer → clinician's dashboard flags it live in Alerts → clinician clicks "Bring them in" → practice dashboard's captured-billing number ticks up. One continuous chain across all three surfaces — that's the pitch, not a slide describing it.

## Submission text structure
1. **The moment**: leaving hospital after a heart failure or COPD admission with a letter and a bag of medications; the deterioration that sends you back builds silently over days while nobody is watching — and separately, the practice that just discharged you is leaving Medicare revenue on the table because nobody has time to hit the TCM billing window by hand.
2. **The gap**: HF 30-day readmission rate 22.3–23% (~1.3M HF hospitalizations/yr); COPD ~20% (~650K/yr) — research/02. 44% of transition medication errors happen at discharge, 31,500 harmed/yr (England) — research/01, cross-market color, not a US claim. Only ~18% of eligible discharges get TCM billed today (ASPE/PTAC 2023) despite Medicare already paying for it.
3. **What we built**: one chain, three surfaces. A discharge letter is parsed by Claude vision into structured meds/changes/red-flags in under 30 seconds. An ElevenLabs voice agent calls the patient every morning, references their actual new medication by name, and a red-flag answer escalates straight to the assigned clinician's dashboard — never to the patient as reassurance, and never as a diagnosis (safety rail #1). The same clinician's "bring them in" decision is what turns an early flag into an avoided ER visit. A wearable notification (Apple Watch hypertension/AFib notifications, FDA-cleared Sept 2025) can trigger the same call-and-review loop as a symptom answer — event-based, never a raw vitals stream (research/06/07). Every TCM/RPM-qualifying contact is logged with who made it, how, and when, because CMS excludes AI/chatbot contact from the billable moment (research/03) — that compliance log is what lets the practice actually bill. The practice ROI dashboard turns all of that into the numbers a physician-group owner actually looks at: billing captured, readmissions avoided, HRRP exposure reduced.
4. **Compliance posture** (quote the event T&Cs back): fully synthetic/fictional data (patient "Margaret Wilson", clinician "Dr. Maria Alvarez" — CLAUDE.md safety rail #4); "prototypes must not be presented as medical advice" — our system never diagnoses, prescribes, or reassures about symptoms (safety rail #1); on severe symptoms the only unconditional response is "call [emergency number] now" + an urgent alert to the clinician (safety rail #2) — the number is looked up from the practice's configured country (`lib/emergency.ts`), not hardcoded to one market, because this is a US-Medicare-framed product with a default of 911.
5. **Wedge → company**: found revenue for physician groups (≈82% TCM under-capture, Jan 2026 CMS codes made the 2–15 day monitoring window billable for the first time) → outcome-labelled detection dataset accumulated inside deployed workflow → HF/COPD beachhead, avoiding undifferentiated chronic/elderly monitoring per the UPMC negative-result evidence (research/05). Full buyer sequence and moat argument: `yc/interview-prep.md` — don't re-derive it live, recite it.
6. **Riskiest assumption named**: enrollment at the discharge door. Concierge pilot with ten families in August tests it first (`yc/interview-prep.md`'s gaps-to-close list).
7. **Founder-fit closer**: anomaly detection on noisy time series in regulated finance; same maths, the signal is a decompensating heart.

## Slides
Title + one stat (HF readmission rate or the ~82% TCM under-capture figure) + roadmap. The demo across the three tabs (doctor → practice → patient) is the deck — do not build slides that re-explain a screen the judges are about to see live.

## Rehearsal checklist
- ⚠️ **The scored on-stage demo is capped at 1 minute per the organizers' actual rubric, not 3.** Use `yc/1-min-pitch.md`'s timed-beats table for that portion — it's the same demo spine below, cut to fit. The 3-minute version (submission text / Q&A / investor conversation) is `yc/pitch-panel-review.md`'s Round 4 script and `PLAN.md` §0; don't confuse the two audiences.
- 5 full run-throughs aloud, ≥1 to a stranger; timed <3:00 every time (long-form version) — plus separately drill the 1-minute cut until it lands at ≤55s; cut words not demo beats.
- Deliberate silences: after the phone rings, and after the practice dashboard's captured-billing number updates.
- Pre-flight the live parse before every rehearsal run: `/doctor` → New patient → From discharge letter → the printed copy of `prebuild/letter-1-hf.html`. This calls the real Anthropic API — confirm `ANTHROPIC_API_KEY` is set and the call completes in a reasonable time before trusting it on stage.
- Q&A rehearsed from `yc/interview-prep.md`'s rapid-fire list: "is this medical advice?" / "why won't Epic/Apple do this?" / "what if the patient doesn't answer?" / "how do you reach families at discharge?" / "who's your first customer?" / "why not a pure billing-automation tool?"

## Do NOT
- Touch code (freeze 10:30; treat as now unless rehearsal exposes a real break).
- Slides beyond title + one stat + roadmap.
- Revive the WhatsApp/family-alert framing from the original consumer plan — CLAUDE.md and MASTER-PLAN.md have superseded it; alerts route to the clinician dashboard only.
- Invent a number that isn't in `./research/` — check MASTER-PLAN's figure-discipline section before saying anything with a dollar sign.
