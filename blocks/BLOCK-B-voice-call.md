# Block B — Voice Check-in Call (Sat 13:00–16:00)

## Objective
An ElevenLabs conversational agent phone-calls the patient, references their ACTUAL new medication by name, runs the check-in script, and the transcript lands back in Supabase as structured data with red flags extracted.

## Starting state
- Pre-built ElevenLabs agent skeleton with generic script; outbound call (or browser call) proven once on Friday
- Parsed patient data in Supabase from Block A

## Tasks in order
1. Server route `POST /api/call/start`: pull patient + meds from Supabase → inject into the agent's system prompt (name, new/changed meds by name, red-flag watchlist) → trigger the call.
2. Agent conversation design (keep it near-scripted for reliability):
   - Warm greeting by first name, "this is your morning check-in"
   - Q1: "Did you take your [new med name] this morning?"
   - Q2: "Any dizziness, weakness, or anything that worries you?"
   - Q3 (condition-specific validated PROM item, not an ad-hoc scale): HF → KCCQ-12-style "How much has shortness of breath limited your daily activities this week?" / COPD → CAT/mMRC-lite "How breathless have you been doing everyday activities?" — patient answers on the same 0–4 verbal scale the call already elicits, no new UI.
   - Close: "Lovely, [name]. Same time tomorrow. Your family can see you're doing well."
3. Safety branch (hard rule from root CLAUDE.md): severe symptom mentioned → ONLY say the 999 line + end call gracefully. Test this branch explicitly.
4. Webhook/polling route to receive the transcript → extract {answers, flags_raised[], mood, proms_score} (one Claude call over the transcript is fine) → insert into checkins. `proms_score` = the 0–4 PROM answer, condition-scoped by `patients.condition_pack`.
5. Flag detection triggers: missed anticoagulant, "dizzy/weak/numb/chest/bleeding/confused", mood ≤ 3, proms_score ≥ 3 (high symptom burden).

## GATE 2 — 16:00
A real phone rings, agent says the correct medication name, a red-flag answer is captured as structured data in checkins.

## FALLBACK
1st: browser-based call instead of phone (still live + audible on stage). 2nd: fully scripted agent (no LLM improvisation) — reliability beats naturalness. The "patient" on stage is a teammate reading fixed answers either way.

## Do NOT
- Build scheduling/cron for daily calls (say "daily" in the pitch; trigger manually in the demo)
- Handle voicemail, no-answer, or retries
- Let the agent free-talk about symptoms or give ANY reassurance/advice
