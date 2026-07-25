# 1-Minute Demo — Script + Real Markscheme Alignment

**See also `yc/pitch-panel-review.md`** — a separate, spoken (no-props) fundability script, iterated through a simulated 10-persona investor panel over 3 rounds. That version is for a YC application video / investor conversation; the timed-beats demo below is for the literal on-stage hackathon DEMO, scored against the real rubric and optimized differently (billing cut, action-led). Don't merge the two.

## The actual markscheme (from organizers, not previously in this repo)
Four scores /10, plus two bonuses:
1. **IDEA /10** — novel, cool, needed. One small problem solved perfectly beats fixing everything.
2. **DESIGN /10** — AI-generated design is recognizable now; stand out with beautiful UX/UI that makes sense for the user.
3. **CODE QUALITY /10** — no slop. Technical work that pushes the AI tools to their limit scores here.
4. **DEMO /10 — 1 minute max.** Clear, easy to understand.
5. **BONUS: real users** — evidence of *how* you got them (Reddit? called your mum's friends?). Cheating scores ZERO.
6. **BONUS: sponsor tools used well** — only where they genuinely help.

## ⚠️ Conflict with existing plan — flagging before you rehearse
`blocks/BLOCK-G-pitch-submission.md` and `blocks/BLOCK-H-freeze-rehearsal.md` were written around a **3-minute stage pitch** ("rehearsed 5x out loud, timed under 3:00"). The real rubric caps the scored demo at **1 minute**. That's a 3x cut, not a trim — the billing-tracker beat, precision slide, and thesis close in Block G's structure don't fit. I've rebuilt the demo below to the real limit and left a note in Block G/H pointing here; I haven't rewritten those files' rehearsal logistics (freeze time, tech checklist) since those are still correct — only the "3-minute" pitch assumption is wrong. Say the word if you want me to edit those two files directly instead of just cross-referencing.

The written **submission text** (Block G §"Submission text structure") likely isn't under the 1-minute cap — that's a text field, not the live/recorded demo — so PLAN.md §0's full locked pitch still governs that. This file only compresses the *demo*.

---

## The 60-second demo — timed beats

This is the existing demo spine from root `CLAUDE.md` ("never break it") timeboxed to the real limit. Nothing new invented — just cut to fit, with the billing/precision/thesis material (which doesn't fit in 60s anyway) pushed to Q&A and the written submission where it already lives (`yc/interview-prep.md`, `PLAN.md` §0).

| Time | Beat | What's said (minimal — let the action carry it) |
|---|---|---|
| 0:00–0:07 | Hold up the printed letter | "Margaret just left hospital on a new heart failure regimen. What happens in the next 30 days, when nobody's watching, is what sends her back." |
| 0:07–0:20 | Photograph it live → parse animates → red flag surfaces | (mostly silent — let the screen do the work) "...and it just caught a dangerous interaction on her repeat list." |
| 0:20–0:35 | Phone rings on stage, patient answers, agent asks the check-in question, patient gives the planted symptom answer | (silent — this is the beat judges remember) |
| 0:35–0:48 | Clinician console flashes the flag with evidence (transcript span, metric trend) | "A nurse sees this instantly, with the evidence — not a black box." |
| 0:48–0:60 | Family phone buzzes on the table | "And her daughter finds out before it's an ambulance." |

**Rehearsal target: 55s, not 60.** Live demos run long under adrenaline; build in 5s of slack. If a beat has to go, cut the clinician-console line (0:35–0:48) to a single word ("confirmed →") — the emotional arc survives on hook → parse/flag → call → family buzz alone.

---

## Scoring the demo against each category

**IDEA (/10) — the trap to avoid:** PLAN.md §0's locked pitch is a full company thesis — HRRP economics, billing capture, dataset moat. That's the right pitch for a YC application and Q&A (keep using it there verbatim, it's locked for a reason). It is **not** what should fill your 60 seconds. The rubric explicitly rewards "one small problem, solved perfectly" — and the demo above already *is* that: one patient, one letter, one caught flag, one family alerted. Don't spend any of the 60 seconds on market size or Medicare codes; that dilutes a sharp idea into a pitch deck. Save it for when a judge asks "how's this a business?" — which is a real question, just not a demo-second question.

**DESIGN (/10):** covered by `PLAN.md` §3's UI spec and the Claude Design pass mentioned there — not this file's concern, but worth noting the rubric explicitly calls out "AI-generated design is recognizable now" as a thing to avoid. If the visual pass hasn't happened yet, that's the highest-leverage remaining work for this score.

**CODE QUALITY (/10) — "pushes the AI tools to their limit":** the synthetic cohort generator + rules engine producing real precision/recall numbers (`strategy/company-and-engineering.md`, PLAN §2 P2/P3) and the event-sourced schema (episodes/events/flags/billing as a real spine, not a demo mock) are your actual answer here — worth a one-line callout if a judge lingers after the 60s ends, since none of that is visible in the demo itself.

**DEMO (/10):** the table above. "Clear, easy to understand" — resist adding the billing tracker or precision slide into the timed portion; both are real work but neither reads in a glance the way a phone ringing does.

**BONUS — real users:** ⚠️ **this is currently unaddressed and time-sensitive.** Nothing in this repo shows real-user contact — `yc/interview-prep.md`'s "10-family concierge pilot" is explicitly listed as a post-hackathon gap, not something done yet. The bonus wants evidence of outreach *before submission*, and fabricating it scores zero — so this has to be real. Cheap, honest options that fit a hackathon weekend: message a few actual caregivers or discharged patients you or family know and ask 5 minutes of reaction to the concept/demo; post in a relevant caregiver or HF/COPD subreddit or forum asking for feedback; call a nurse or GP contact if you have one. Whatever you actually do, note down *who, how, when* — that's literally what's being scored, not the headcount.

**BONUS — sponsor tools:** `CLAUDE.md`'s stack — Claude (vision + parsing), ElevenLabs (voice agent), Supabase (Postgres + Realtime), Vercel (hosting) — reads like a sponsor list already. Confirm which of these are actual hackathon sponsors, and if so, make sure the demo naturally shows *why* each one is doing real work (Supabase Realtime pushing the live dashboard update as the flag fires is a good example of "genuinely helps," not just name-dropped).
