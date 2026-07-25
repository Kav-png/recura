# Block C — Family Alert (Sat 16:00–18:00)

## Objective
Red flag in a check-in → WhatsApp template message to the family phone in < 10 seconds. Telegram wired in parallel to the same trigger. This is the emotional payoff of the demo — the judge-visible phone buzz.

## Starting state
- WhatsApp utility template submitted Wednesday (check status FIRST — it decides the primary path)
- Telegram bot created via BotFather; family chat_id captured
- checkins rows now contain flags_raised (Block B)

## Tasks in order
1. `sendAlert(patientId, checkinId)` server function: compose message from flag data, fan out to enabled channels, insert into alerts with delivery status.
2. WhatsApp path: Cloud API `POST /{phone_number_id}/messages` with the approved template + variables {name, symptom, time}. Family number must be a registered test recipient on the Meta test number — verify NOW, not on stage.
3. Telegram path: simple `sendMessage` with the same content + a link to the dashboard alert.
4. Trigger wiring: Block B's transcript processor calls sendAlert automatically when flags_raised is non-empty. No human in the loop.
5. Message copy (make it feel human, not like a system log):
   "🔴 Margaret's morning check-in flagged something: she reported feeling dizzy and hasn't taken her apixaban. Flagged at 9:14am. Open her dashboard: [link]"

## GATE 3 — 18:00
Full chain succeeds once: call → red-flag answer → family phone buzzes with the alert.

## FALLBACK
WhatsApp template not approved/failing → Telegram is primary; pitch line (only if true): "our WhatsApp utility template is approved and in production wiring." Neither working → Twilio SMS, 30-minute build, same sendAlert interface.

## Do NOT
- Build alert preferences, quiet hours, or multiple family members
- Retry-queue infrastructure — one try + visible error state is enough
- Spend > 45 min fighting Meta's dashboard; that's what the Telegram path is for
