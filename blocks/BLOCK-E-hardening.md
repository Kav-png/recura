# Block E — Hardening + Backup Video (Sat 23:00–01:00)

## Objective
NOT features. Make the demo chain boringly repeatable and produce the insurance video.

## Tasks in order
1. Run the FULL chain 5 consecutive times: photo → parse → call → flag → WhatsApp buzz → dashboard banner. Log every failure; fix ONLY what broke, in order of demo impact.
2. Demo-day switches: seed script that resets the demo patient to a clean pre-parse state in one command (`npm run demo:reset`). Test it twice.
3. Kill silent failures on the demo path: every server route returns a visible error state in the UI. A stuck spinner on stage is unrecoverable; an error card lets you retry with a joke.
4. Record the backup video on a phone, ONE clean run, real audio of the call and real buzz. Transfer to a second device + upload to Drive.
5. Write /DEMO-RUNBOOK.md: exact click-by-click order, which browser tabs to pre-open, hotspot name/password, phone numbers involved, the reset command.

## GATE 5 — 01:00 (the go-to-sleep gate)
Backup video exists on two devices. Chain has succeeded ≥ 3 consecutive times.
If YES → sleep. If NO → fix the single most broken link only, HARD STOP 02:00, sleep regardless. A rested founder beats a zombie with one more feature — the judges are YC people, they're evaluating YOU too.

## Do NOT
- Add anything. This block has a zero-feature policy.
- Refactor. Ugly working code sleeps tonight.
