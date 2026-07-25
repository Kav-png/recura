# CLAUDE.md — Discharge Safety Net (root context, applies to every block)

**Canonical plan: ./MASTER-PLAN.md** — the institutional pivot (2026-07-25) supersedes the consumer framing below and in PLAN.md. PLAN.md and blocks/ still hold reusable engineering (letter-parse pipeline, voice check-in mechanics) — read MASTER-PLAN.md first, then pull the relevant block for implementation detail where it doesn't conflict. UI: the doctor dashboard follows the visual language extracted from `.design-ref/` (Claude Design mock) per MASTER-PLAN.md's Design system section — do NOT invent new visual styling beyond that reference.

## What we're building
A health hackathon project (Juno Consumer Health Hackathon, judged by YC founders, submission Sun 12:00 sharp — freeze 10:30, submit by 11:50) — pivoted mid-hackathon from a consumer product to an **institutional one, sold to physician groups/hospitals** (see MASTER-PLAN.md and strategy/us-readmissions-thesis.md for why).
The product: a discharge letter is parsed (Claude vision) into structured meds/changes/red-flags → an ElevenLabs voice agent rings the patient every morning for a 90-second check-in → any red-flag answer escalates to the assigned clinician's dashboard for review (severe symptoms still get an immediate "call [emergency number] now" to the patient — that's unconditional, see rail #2; the number itself is derived from the practice's configured country via `lib/emergency.ts`, set on the Settings page, not hardcoded to one country) → three product surfaces: a **doctor/nurse dashboard** (patient panel, check-ins, transcripts, alerts, billing status), a **practice ROI dashboard** (money saved/captured), and a **patient portal** (plain-English plan, daily check-in).

The demo spine (updated): printed letter → live photo parse → red flag shown → phone rings on stage → red-flag answer → clinician's dashboard flags it live → clinician marks "bring them in" → practice dashboard's captured-billing number ticks up.

## Stack (do not deviate without asking)
- Next.js (App Router) deployed on Vercel
- Supabase: Postgres + Realtime subscriptions.
- **Clinician auth (`/doctor`, `/practice`, `/settings`): real per-clinician Supabase Auth**, not a shared code. `clinicians.auth_user_id` ties a Supabase Auth user to a clinician row; Postgres RLS (not app code) scopes patient visibility via `SECURITY DEFINER` helpers `current_clinician_id()`/`current_clinician_is_admin()` — a non-admin clinician sees only their own assigned patients, an admin (`clinicians.is_admin`) sees the whole practice. `proxy.ts` validates the session via `@supabase/ssr`. See README's "Access control & audit trail" for seeded demo logins and the `audit_log` table (`lib/audit.ts`).
- **Patient portal (`/patient`) auth: unchanged** — still the shared access code (`ACCESS_CODE` env var, cookie set via `proxy.ts`, checked with `lib/auth.ts`), since a real patient never has an individual clinician-style account.
- Anthropic API (claude-sonnet-4-6) for letter parsing (vision + structured JSON out)
- ElevenLabs Conversational AI for the check-in call
- All third-party calls happen in Next.js server routes / server actions. NEVER put API keys in client code.

## Database schema (Supabase)
See MASTER-PLAN.md's Data model section for the current schema (practices, clinicians, patients, medications, red_flags, checkins, alerts, billing_events). It extends rather than replaces the shape below; alerts route to a clinician_id, not a family phone number. Also extended since: `clinicians.auth_user_id`/`is_admin`, an `allergies` table and `patients.resuscitation_status`/`emergency_contact_name`/`follow_up_clinic` (all parsed from the discharge letter alongside meds/red-flags), and an `audit_log` table (who viewed/actioned what, distinct from the existing TCM/RPM billing-compliance columns on `patients`, which record whether a required contact happened, not who looked at the chart).

## Safety rails (hard requirements, never relax)
1. The system NEVER diagnoses, prescribes, or reassures about symptoms. It notices, explains in plain language, and escalates to humans.
2. On severe symptoms (chest pain, stroke signs FAST, heavy bleeding, breathing difficulty): the voice agent's ONLY response is "please call [emergency number] now" + fire an urgent alert to the clinician dashboard. The number is looked up from the practice's configured country (`lib/emergency.ts`, set via Settings → Practice region) — never hardcode a specific country's number in new copy. No follow-up questions first. This rail is unconditional regardless of which product surface receives the alert.
3. Every plain-English medical explanation ends with "check with your pharmacist or GP".
4. No real patient data anywhere. Demo data only (patient "Margaret Wilson" and clinician "Dr. Maria Alvarez", fictional).

## Research library (./research/)
Every statistic, price, code rate, or clinical claim used anywhere in this project has a sourced entry in ./research/ (see its README.md for the index and confidence key). Before writing ANY number into pitch text, submission copy, UI, or docs: check it against the research files. If a figure isn't there, do not invent or half-remember it — find a source and add it to the right research file first. Strategy narrative lives in ./strategy/us-readmissions-thesis.md; the business model canonical statement is research/08-business-model.md.

## Working style for this repo
- Hackathon mode: ship the demo path first, no premature abstraction, no tests unless a gate demands reliability proof.
- BUT: no secrets client-side, no unhandled promise rejections on the demo path, and every external call has a try/catch with a visible failure state (a silent failure on stage is the worst outcome).
- Each block has its own file in ./blocks/. Read the relevant block file before starting work. Respect its GATE and STOP conditions — if the gate deadline passes, implement the FALLBACK, do not keep debugging the primary path.
- Ask before adding any feature not listed in the current block. The answer is usually no.
