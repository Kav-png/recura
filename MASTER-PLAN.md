# MASTER PLAN — Institutional Pivot (supersedes PLAN.md demo spine)

**Status: canonical as of 2026-07-25.** PLAN.md and blocks/ remain useful for the parsing pipeline (Block A) and voice check-in mechanics (Block B) — reuse that engineering, not the consumer framing. CLAUDE.md's pointer and safety-rail wording have been updated to match this doc.

## Why we pivoted

Documented in [strategy/us-readmissions-thesis.md](strategy/us-readmissions-thesis.md) and [research/08-business-model.md](research/08-business-model.md): the buyer is not the patient's family, it's **physician groups / hospitals**, and the revenue is Medicare TCM + RPM billing capture (~$274–372/episode) plus HRRP penalty avoidance — not a consumer subscription. Today's build turns that thesis into three concrete product surfaces instead of one consumer flow.

## The three surfaces

1. **Doctor/nurse dashboard** (build first, today) — the clinician's panel: patient list, per-patient check-in history and call transcripts, PROMs trend, medication list, and a detection layer that flags symptoms **to the clinician, not the patient**. The clinician (not an algorithm) decides "bring them in" — that decision is the product's real value, and it's what turns an early flag into an avoided ER visit / readmission. Also surfaces per-patient TCM/RPM billing status (2-day contact done? days of RPM data this period? F2F scheduled?) since that status is what the practice bills against.
2. **Practice/institution overview** (build second) — the ROI page a practice administrator or physician-group owner looks at: total billing captured this period, estimated readmissions avoided, cost avoided, HRRP exposure reduced, enrollment funnel, per-clinician breakdown. This is the "how much money are we saving/making" page — the literal sales pitch made real inside the product.
3. **Patient app/website** (build third) — replaces the old "family member gets a WhatsApp" framing. The patient logs in, sees their own med list and discharge plan in plain English, does the daily check-in/PROMs (voice call remains the primary channel; web is a secondary path), and sees their own status. No family-alert channel in this version — escalation goes to the care team, per #1.

## What changes vs. the original consumer plan

- **Alert routing**: red-flag check-in answers now escalate to the assigned clinician's dashboard (with an urgent-review state), not a family WhatsApp/Telegram message. The "call [emergency number] now" instruction to the patient for severe symptoms is unchanged in kind — that's a hard safety rail, not a business decision — but the number itself is no longer hardcoded to "999": it's driven by the practice's configured country (`practices.country`, `lib/emergency.ts`, set via Settings → Practice region), since this pivot is US-Medicare-framed and the default is now US/911. Real-time alert generation (`lib/checkinExtraction.ts`) and the patient portal (`StatusCard`, `SelfCheckinForm`) read this live; seeded/historical transcript text is frozen at whatever country was default when seeded.
- **Identity model**: previously one hardcoded family; now a hardcoded demo **practice** with a hardcoded demo **clinician** (Dr. Maria Alvarez, matching the Claude Design mock) and a panel of demo patients. Still no real auth for the hackathon — a single practice_id constant is fine.
- **Billing becomes first-class data**, not a narrative footnote — it's a table (`billing_events`) that both the doctor dashboard (status chips) and the practice dashboard (aggregate $) read from.

## Data model (extends the existing Supabase schema in CLAUDE.md)

```
practices(id, name)
clinicians(id, practice_id, name, role: physician|nurse, specialty)

patients(id, practice_id, clinician_id, name, phone, discharge_date,
         condition: HF|COPD, enrolled_at,
         tcm_contact_done bool, tcm_contact_date,
         f2f_scheduled_date, rpm_days_this_period int)

medications(id, patient_id, name, dose, frequency,
            status: new|changed|stopped|unchanged, reason text)   -- unchanged

red_flags(id, patient_id, severity: info|warn|danger, title,
          explanation_plain_english, source: letter|call)          -- unchanged

checkins(id, patient_id, called_at, transcript jsonb, summary,
         mood, proms_score, flags_raised jsonb)                    -- unchanged

alerts(id, patient_id, checkin_id, severity, message,
       clinician_id, reviewed_by, reviewed_at,
       action_taken: none|call_patient|bring_in|escalate_911,
       sent_at)                                                    -- channel/delivered dropped, review fields added

billing_events(id, patient_id, code, amount, status: pending|captured,
                period_start, period_end)                          -- new
```

## Design system

Source: `Medical dashboard build.zip` (Claude Design mock, extracted to `.design-ref/`) — a generic ward-monitoring layout, used for its **visual language**, not its literal content (it shows inpatient ICU vitals; ours is post-discharge outpatient monitoring). Carry forward:
- Palette: oklch-based warm neutrals + amber/terracotta primary (`oklch(64% 0.15 35)`), critical/warning/stable semantic colors
- Fonts: Figtree (headings/weight), Inter (body)
- Layout: fixed dark sidebar (88px) + topbar + 3-column grid (patient list / detail / alerts+schedule)
- Component library block (buttons, badges, tabs, form fields, callouts, modal) as the base component set

Adapt content: patient list shows days-post-discharge + condition (not room numbers); center detail shows check-in history, call transcript viewer, PROMs trend, red flags, and billing status instead of live ICU vitals; right rail keeps Alerts (now "review needed" review-and-act, not passive) and Today's Schedule (outbound check-in calls, not bedside rounds).

## Build order

1. ~~Master plan~~ (this doc)
2. Scaffold Next.js (App Router) + Tailwind + Supabase project; apply the schema above with seed data (Dr. Maria Alvarez, practice, 6–8 demo patients across HF/COPD, seeded check-ins/transcripts/alerts/billing rows)
3. **Doctor dashboard** — patient list, patient detail (check-ins, transcripts, meds, red flags, billing status), alerts panel with review/bring-in action, today's schedule
4. **Practice overview dashboard** — ROI aggregates, per-clinician breakdown, enrollment funnel
5. **Patient portal** — plain-English plan view, daily check-in/PROMs web path
6. Reconnect Block A (letter parse) and Block B (voice call) pipelines so dashboard data is live, not just seeded, for the demo

## Access & demo data (built alongside step 3)

- `/login` gates `/doctor`, `/practice`, `/patient`, `/settings` behind a shared access code (`ACCESS_CODE` env var), checked via `proxy.ts` against a signed session cookie. Not per-user auth — just enough that the localhost link isn't wide open when shared.
- `/settings` has a "Reload demo patients & transcripts" button (`lib/demoData.ts` → `reloadDemoData()`) that wipes and reseeds the whole demo dataset from a TS fixture (source of truth going forward, not the old SQL migrations) — patients, meds, red flags, 5-day check-in history with transcripts, alerts, billing. Use before each rehearsal so reviewed alerts don't carry over.

## Open items to confirm before step 4–6 (not blocking step 2–3)

- Practice dashboard's exact ROI numbers should trace to research/08-business-model.md figures (~$274–372/episode, HRRP penalty avg $217K) — pull real figures, don't invent new ones, per CLAUDE.md's research-citation rule.
- Whether the patient portal ships for the actual demo or stays a described-but-unbuilt surface, given the freeze deadline — revisit once 1–4 are done.

## Wearables detection layer (added 2026-07-25)

Grounded in research/06-regulatory-compliance.md and research/07-market-sizing-why-now.md — do not invent wearable capabilities beyond what's sourced there.

- **What's real and sourced**: Apple cleared the Hypertension Notification Feature (HTNF) — FDA 510(k) K250507, Sept 11 2025. It's a passive 30-day-pattern **notification**, not a diagnosis and not continuous clinical BP. Irregular Rhythm Notification (AFib-pattern) is a long-standing Apple Watch feature. Demo wearable data must stay inside this envelope — discrete, pre-classified notifications, not raw waveforms.
- **Why discrete events, not raw signal streams (regulatory + UX, same answer)**: research/06 — FDA non-device CDS status requires analyzing *discrete* medical information with clinician-reviewable reasoning, not raw signal-acquisition data (PPG/ECG waveforms) — that tips into SaMD/510(k) territory. Separately, research/05's UPMC RCT negative result is explicit: unfiltered monitoring increases readmissions via alert fatigue and ED-routing bias. Both point the same direction: **event-based, not stream-based** — a small number of named, pre-classified events (hypertension notification, irregular rhythm notification, fall detected, high/low heart rate), not a live vitals feed the doctor has to watch.
- **Data model**: new `wearable_events` table — `id, patient_id, device (e.g. "Apple Watch Series 11"), event_type (hypertension_notification | irregular_rhythm_notification | high_heart_rate | low_heart_rate | fall_detected), detected_at, detail, severity, triggered_checkin_id (nullable → checkins.id)`. `alerts` gains `source (call|letter|wearable)` and `wearable_event_id` (nullable) so a wearable-triggered alert links back to both the originating device event AND the check-in call it prompted — the doctor reviewing an alert sees the wearable signal, the follow-up call transcript, and how the patient described feeling, together in one place, not just a number.
- **UI**: patient detail gains a "Wearable Signals" card (same visual language as Red Flags); alerts show a source icon (watch vs phone vs letter) so it's immediately clear whether a flag is event-triggered vs call-derived.

## Billing / practice ROI screen — figure discipline (added 2026-07-25)

Per research/02-us-hrrp-penalties-costs.md's explicit rule: **never pitch ROI off the ~$13–15K gross readmission cost** — use the avoidable-cost figure. HF avoidable cost = $2,488; general/COPD (no COPD-specific figure sourced — use the $2,140 general average, do not invent a COPD number) = $2,140. Pair with HRRP penalty exposure (avg ~$217K/hospital, FY2024) and captured TCM/RPM billing ($274–372/episode) — three separate, separately-labeled numbers, not blended into one invented "savings" figure.

## Compliance / audit logging (added 2026-07-25)

research/03-reimbursement-codes.md flags two rules as "product-defining": (1) the TCM 2-day interactive contact must come from a physician/QHP/clinical staff — CMS's MAC guidance explicitly excludes "digital assistants such as chat bots, Siri, or Alexa"; AI cannot make the billable TCM contact. (2) RPM/RTM's "interactive communication" requires real-time synchronous two-way audio — CMS's CY2026 Final Rule declined to bless automated messaging when asked. Both are billing-defense requirements: if audited, the practice needs to show WHO made the qualifying contact, HOW (live phone/video/in-person, never automated), and WHEN.

`patients` gained `tcm_contact_by`/`tcm_contact_method`, `rpm_live_contact_at`/`rpm_live_contact_by`/`rpm_live_contact_method`, and `consent_captured_at` (TCPA — research/06 — consent must be captured at enrollment, revocation honored). The doctor's patient detail page surfaces this as a "Compliance Log" card. Note: adding two more FKs from `patients` to `clinicians` (beyond the existing `clinician_id`) makes any bare `patients.select("*, clinicians(...))")` embed ambiguous in PostgREST — those queries now need explicit `!fk_name` hints (see `lib/queries.ts`).

## Clinician auth, per-patient RLS, and access audit trail (added 2026-07-25)

Prompted by wanting a real answer — not a slide — to "who can see which patient's data, and can we prove it" for an institutional buyer. Replaces the shared-`ACCESS_CODE`-for-everything model for clinician-facing surfaces only; the patient portal is unchanged (see CLAUDE.md Stack section for why it's a deliberately separate mechanism).

- **Data model**: `clinicians` gained `auth_user_id` (uuid, unique, → `auth.users.id`) and `is_admin` (bool). New `audit_log(id, actor_clinician_id, patient_id, action, metadata jsonb, occurred_at)` — a generic "who did what" trail, distinct from the TCM/RPM compliance columns above (those record *whether* a required billing contact happened; this records *who viewed/actioned a chart*).
- **Enforcement is at the database, not the app**: three `SECURITY DEFINER` Postgres functions (`current_clinician_id()`, `current_clinician_is_admin()`, `current_clinician_practice_id()`) resolve the calling clinician from `auth.uid()`. RLS policies on `patients` and every child table (`medications`, `red_flags`, `allergies`, `checkins`, `alerts`, `billing_events`, `wearable_events`) use these to scope `authenticated`-role access to `clinician_id = current_clinician_id() OR current_clinician_is_admin()` — no `is_demo` bypass for authenticated sessions, so the demo data itself enforces real scoping (verified: a non-admin session hitting another clinician's patient by URL gets a 404, not a filtered list). The pre-existing anon-role `is_demo=true` policies are untouched and still back the unauthenticated patient portal.
- **Demo seeding**: `lib/clinicianAuth.ts` provisions/keeps-in-sync a Supabase Auth user per seeded clinician on every reseed (`DEMO_CLINICIAN_PASSWORD`). Dr. Alvarez is seeded `is_admin=true` (sees all 10 demo patients); the NP is not (sees only her 4 assigned patients) — deliberately, so logging in as each shows a genuinely different, correctly-scoped panel. Reseeding must be run as the admin account, since it provisions patients under both clinicians' ids.
- **Audit logging** (`lib/audit.ts`): best-effort, never blocks the action it's describing; called from `getPatientDetail` (view) and the key mutation actions (alert review, TCM/RPM live-contact logging, new patient added). A clinician can query their own history; only an admin can query everyone's.
- **Letter-parse field additions** (same session, unrelated to auth but landed together): `allergies` table and `patients.resuscitation_status`/`emergency_contact_name`/`follow_up_clinic`, extracted by `lib/letterParse.ts` alongside meds/red-flags/condition. Allergies double as a potential red-flag input (a newly prescribed med conflicting with a known allergy), though that cross-check isn't implemented yet.
