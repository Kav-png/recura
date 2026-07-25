# MASTER PLAN — Institutional Pivot (supersedes PLAN.md demo spine)

**Status: canonical as of 2026-07-25.** PLAN.md and blocks/ remain useful for the parsing pipeline (Block A) and voice check-in mechanics (Block B) — reuse that engineering, not the consumer framing. CLAUDE.md's pointer and safety-rail wording have been updated to match this doc.

## Why we pivoted

Documented in [strategy/us-readmissions-thesis.md](strategy/us-readmissions-thesis.md) and [research/08-business-model.md](research/08-business-model.md): the buyer is not the patient's family, it's **physician groups / hospitals**, and the revenue is Medicare TCM + RPM billing capture (~$274–372/episode) plus HRRP penalty avoidance — not a consumer subscription. Today's build turns that thesis into three concrete product surfaces instead of one consumer flow.

## The three surfaces

1. **Doctor/nurse dashboard** (build first, today) — the clinician's panel: patient list, per-patient check-in history and call transcripts, PROMs trend, medication list, and a detection layer that flags symptoms **to the clinician, not the patient**. The clinician (not an algorithm) decides "bring them in" — that decision is the product's real value, and it's what turns an early flag into an avoided ER visit / readmission. Also surfaces per-patient TCM/RPM billing status (2-day contact done? days of RPM data this period? F2F scheduled?) since that status is what the practice bills against.
2. **Practice/institution overview** (build second) — the ROI page a practice administrator or physician-group owner looks at: total billing captured this period, estimated readmissions avoided, cost avoided, HRRP exposure reduced, enrollment funnel, per-clinician breakdown. This is the "how much money are we saving/making" page — the literal sales pitch made real inside the product.
3. **Patient app/website** (build third) — replaces the old "family member gets a WhatsApp" framing. The patient logs in, sees their own med list and discharge plan in plain English, does the daily check-in/PROMs (voice call remains the primary channel; web is a secondary path), and sees their own status. No family-alert channel in this version — escalation goes to the care team, per #1.

## What changes vs. the original consumer plan

- **Alert routing**: red-flag check-in answers now escalate to the assigned clinician's dashboard (with an urgent-review state), not a family WhatsApp/Telegram message. The "call 999 now" instruction to the patient for severe symptoms is unchanged — that's a hard safety rail, not a business decision.
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
