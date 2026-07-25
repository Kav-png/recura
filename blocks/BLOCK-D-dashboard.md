# Block D — Clinician Console + Family View (Sat 19:00–23:00) — PLAN.md §3 screens B, C, E are the spec; console is PRIMARY, family view is the reduced secondary

## Objective
One page that makes a judge feel what the daughter feels: calm oversight normally, unmissable urgency when a flag fires. Updates LIVE on the projector while the phone buzzes.

## Starting state
Blocks A–C green (or their fallbacks). Real parse + checkin + alert rows in Supabase from today's testing.

## Tasks in order
1. `/family` page, three zones:
   - Top: patient card (name, days since discharge, "last check-in: this morning, sounded well ✓")
   - Middle: medication timeline — what changed at discharge (new = green "started", stopped = struck through, changed = amber), each with its one-line reason
   - Bottom: check-in log — one row per call: date, mood score, one-line summary, expandable transcript
2. Alert state: Supabase Realtime subscription on alerts → red banner slides in at top with the alert text + timestamp. This must visibly appear WITHOUT a page refresh (this is the live-on-projector moment).
3. Design: calm, warm, trustworthy. Soft neutrals, one accent, generous spacing, large readable type (the persona is a 50-year-old daughter on her phone). NOT a SaaS admin panel, NOT dark-mode crypto. Read /mnt/skills/public/frontend-design/SKILL.md first if styling from scratch.
4. Mobile-first layout — it will be shown on a phone screen at least once in the pitch.

## GATE 4 — 23:00
Dashboard renders real data from today's test calls AND the red banner appears live when an alert fires.

## FALLBACK
Static dashboard with pre-loaded data; only the alert banner stays live (that's the only element that must be real-time). If Realtime is fighting you, poll every 3s — nobody can tell.

## Do NOT
- Charts, analytics, trends, or a patient-facing view
- Settings, profiles, navigation beyond this one page
- Redesign past 22:30 — design churn at midnight is how demos die
