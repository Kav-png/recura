# FINAL PLAN — Pitch · Phases · Engineering · UI
### Canonical plan. Supersedes blocks/ where they conflict; blocks/ remain the hour-by-hour gates. Figures → research/. Strategy → strategy/.

---

## 0. THE PITCH (locked — use verbatim in submission text, judge Q&A, and every slide)

**Problem:** 1 in 4 heart failure patients and 1 in 5 COPD patients are back in hospital within 30 days — and the deterioration that puts them there builds silently over days while nobody is watching.

**Solution:** a detection engine for the 30 days after discharge — daily AI voice check-ins plus wearable baselines catch the early signature of decompensation (rising resting HR, falling HRV, creeping symptoms — see `research/05-evidence-base.md`'s HeartLogic/MultiSENSE entry for the sourced clinical basis) and flag it to a clinician with evidence, days before it becomes an ambulance.

**Market:** ~2M annual US HF/COPD discharges where hospitals eat the readmission cost and physician groups leave ~$300 of Medicare reimbursement uncaptured per patient.

**Why now:** Jan 2026 CMS codes made short post-discharge monitoring billable for the first time, Apple Watch just got FDA-cleared for hypertension detection, and voice AI finally sounds human at pennies per call.

**Moat:** every clinician confirm/dismiss on every flag becomes a training label tied to a real 30-day outcome — a condition-specific detection dataset that only exists inside deployed clinical workflow.

**Why me:** I build anomaly detection on noisy time series in regulated finance for a living — same maths, the signal is a decompensating heart instead of a moving market.

**Honest flag (regulatory discipline — applies everywhere, not just HF):** HF/COPD decompensation detection from wearable signals is exactly where the FDA SaMD line sits. The pitch, the UI copy, and every flag explanation say **"flags patterns for clinician review"** — never "predicts," "diagnoses," or "detects [condition]." Same tech, survivable claim.

**Beachhead (locked everywhere in this repo — heart failure AND COPD, together, from day one):**
- HF: 23% 30-day readmission rate, ~1.3M hospitalizations/yr
- COPD: ~20% readmission rate, ~650K hospitalizations/yr
- Both are exactly where the UPMC trial showed generic monitoring fails and condition-specific detection wins (see `strategy/us-readmissions-thesis.md` §3)

**Relationship to Juno:** we are the acute 30-day detection layer — hospital-paid, clinician-in-loop, terminating. Juno is chronic self-management — consumer-paid, patient-initiated, longitudinal. At day 31, the structured episode (wearable baseline history + scored PROMs + confirmed/dismissed flags) hands off as a clean data packet to a Juno-style companion. Complementary by construction, not competitive.

---

## Phases

### Phase 0 — Hackathon prototype (this weekend)
**Spec:** prove, live, on stage, that discharge letter → daily voice check-in (with condition-specific PROM) + wearable baseline fusion → clinician-confirmed flag with evidence → family alert → billing capture all work end-to-end on real services, against a published HF+COPD precision/recall number.

**Deliverables:**
- Parse pipeline: letter photo → structured meds + red flags, deployed, <30s
- Voice check-in: ElevenLabs call, med-specific + condition-specific PROM item, hard-coded emergency branch
- Detection engine wired live: wearable-baseline deviation + symptom severity + PROM score fused into evidence-backed flag rows (pre-built, no dedicated block — see Engineering §3 below)
- Family alert: confirmed/danger flag → WhatsApp/Telegram, <10s
- Clinician console: roster, flag queue with 4-part evidence (transcript span, metric sparkline, missed-dose, PROM score), billing tracker
- Precision/recall slide from a 100-patient synthetic HF+COPD cohort
- Backup video (2 devices) + `DEMO-RUNBOOK.md`
- 3-minute pitch + submission text locked to §0 above

### Phase 1 — Pilot (Aug–Q4 2026)
**Spec:** one hospital, HF **and** COPD service lines together (not sequential — the evidence supports both now), physician champion, real patients, real wearables, real clinicians confirming/dismissing.

**Deliverables:**
- 10-family concierge pilot, August (the named riskiest assumption)
- 50–100 discharges across HF + COPD by end of pilot
- Alert precision published to the buyer quarterly (the UPMC failure mode is the sales slide)
- TCM/RPM billing-capture uplift measured and reported
- Written regulatory-counsel opinion on SaMD posture before any claim stronger than "flags patterns for clinician review" is risked anywhere

### Phase 2 — Expansion (2027)
**Spec:** 3–5 mid-size hospitals with existing HRRP penalty exposure (public CMS data = literal target list), same two conditions, deeper wearable integration, ML replacing rules where labels beat them.

**Deliverables:**
- Target list built from public CMS penalty data
- ML triage v2 trained on accumulated confirm/dismiss + outcome labels, replacing V1 rules where it beats them on precision
- Epic write-back pilot with one health system
- De-identification pipeline in production

### Phase 3 — Platform (2028+)
**Spec:** the detection layer as the product — per-episode platform fee + % of enabled billing capture, condition-specific dataset moat, day-31 Juno handoff live, possible additional HRRP conditions once the HF/COPD moat is proven.

**Deliverables:**
- Full L4 claims assembly + audit trail
- Consent/TCPA management, Twilio-BAA channel swap
- Dataset network effects demonstrable across hospitals
- Day-31 Juno-style handoff integration live

---

## 1. PRODUCT NOTES (Phase 0 detail)

**Framing decision (from Jay session):** patient-facing in experience, PHYSICIAN-CONTROLLED in architecture and pitch. The clinician console is the primary demo surface; the patient only feels a warm daily phone call.

**Users & what each sees:**
- **Patient** (any discharged person, not just those with caregivers): receives the daily call. No app required. Optional wearable connection.
- **Family contact:** instant alert on flags + a simple read-only view (timeline, "she's okay today").
- **Clinician/nurse (the star of the demo):** console with patient roster, episode timelines, call transcripts, FLAG QUEUE with confirm/dismiss, and the billing tracker (TCM clock + codes captured).
- **The company (invisible):** every confirm/dismiss + outcome = training label; de-identified dataset = the moat.

**Demo storyline (3 min):** printed HF discharge letter → photographed live → parsed episode + red flag (new HF regimen + interacting NSAID) → phone rings, live mock patient (Tadia, real discharge summary, consented) answers → agent detects the planted symptom → clinician console flashes the flag with evidence → judge-held phone buzzes (Telegram/WhatsApp) → billing tracker ticks "$278 captured" → precision slide from synthetic HF+COPD cohort → close on the thesis.

**Explicitly out of scope (hackathon):** auth, EHR/FHIR, real NHS/insurer integration, ML-trained triage (rules only), scheduling real F2F appointments, iOS/Android native apps.

**Demo letter note:** `prebuild/letter-1-hf.html` is the live-parse demo asset — a heart failure discharge letter (new furosemide/sacubitril-valsartan regimen + interacting ibuprofen on the repeat list, fluid-retention/blunted-diuretic risk). No stroke anywhere in the demo — letter, precision slide, and condition packs are all HF/COPD, matching the beachhead exactly. `prebuild/letter-2-clean.md` (COPD, zero danger flags) is the Block F no-false-alarm asset.

---

## 2. ENGINEERING (Phase 0 build order, mapped to the 5-layer architecture in strategy/company-and-engineering.md)

### Pre-build (before Saturday — extends prebuild/PREBUILD.md)
- P1. Parse prompt hardened on 3 mock letters (+ Tadia's real summary once received; strip identifiers, get consent in writing).
- P2. Synthetic cohort generator (`tools/synth_cohort.py`): 100 patients × 30 days of discrete wearable metrics (resting HR, HRV, steps, sleep) with per-patient baselines + circadian noise; inject deterioration events — HF decompensation (HR↑ HRV↓ over 4 days), COPD exacerbation (resting HR↑ + steps↓ + sleep fragmentation over 3–4 days), non-adherence pattern, 70 benign controls. Output CSV + ground-truth labels. Hold out 20%. COPD pattern reuses the HF generator's noise/baseline code — new deterioration profile, not new infra.
- P3. Triage rules v1 (`engine/rules.ts`): per-patient 72h baseline, deviation scoring, symptom-severity mapping from transcript findings + PROM score, condition packs (HF/COPD). Run against synthetic cohort → precision/recall numbers for THE SLIDE.
- P4. ElevenLabs agent + one proven outbound call. Telegram bot live; WhatsApp utility template submitted.
- P5. Repo scaffold deployed: Next.js (App Router) + Supabase + Vercel; schema below.

### Schema (extends root CLAUDE.md schema — L2 episode record)
- episodes(id, patient_id, discharged_at, condition_pack, status)
- events(id, episode_id, ts, source: letter|call|wearable|nurse|system, type, payload jsonb, confidence)  ← event-sourced spine; everything else is a view over this
- flags(id, episode_id, severity, evidence jsonb {transcript_span, metric_trend, missed_dose, proms_score}, status: open|confirmed|dismissed, decided_by, decided_at)  ← confirm/dismiss = the label
- billing(id, episode_id, code, status: pending|satisfied|billed, satisfied_by_event_id, deadline_at)  ← TCM clock lives here

### Saturday–Sunday build order (gates in blocks/ still apply)
1. **L1 ingest** (Block A): photo → parse → verify screen → episode + events + initial flags. GATE 1 unchanged.
2. **L1 voice** (Block B): call with per-patient context; transcript → LLM symptom extraction → events; emergency script hard-coded. GATE 2 unchanged.
3. **L3 triage v1** (pre-built rules wired live — no dedicated block/gate; wire between Block B and Block C, verify at least one synthetic deterioration case still fires against the deployed app before Block C starts): every new event re-scores → flag rows with evidence payloads.
4. **L5 alert** (Block C): confirmed-or-danger flag → Telegram/WhatsApp within 10s. GATE 3 unchanged.
5. **CLINICIAN CONSOLE** (Block D, expanded — primary UI, see §3): roster → patient → timeline/transcripts/flag queue/billing tracker. Confirm/dismiss writes flags.status + a nurse event (the labeling loop, demoed live).
6. **Family view** (Block D, reduced): read-only timeline + alert banner.
7. **Billing tracker logic** (mini-L4): TCM 2-business-day countdown ticking from discharged_at; codes flip pending→satisfied when their triggering event lands (contact logged, ≥2 wearable days, ≥10 min documented). Display only — no claims generation this weekend.
8. Hardening + backup video (Block E), wow-layer (Block F: voice "read my letter" or letter-2 no-false-alarm), pitch (Block G, 09:00–10:30), freeze + SUBMIT BY 11:50 (Block H — deadline moved to 12:00).

### Post-hackathon engineering — see Phase 1–3 above for the sequenced version. Do NOT build any of this this weekend.

---

## 3. UI (Phase 0 detail; structure + states now, VISUAL DESIGN LATER IN CLAUDE DESIGN — do not freestyle aesthetics in code)

**Design principles for the eventual design pass:** calm clinical trust (closer to NHS App than to a startup dashboard); evidence-forward (every flag shows its receipts); zero-training nurse UX (confirm/dismiss reachable in ≤2 taps); family view legible to a stressed 55-year-old on a phone (large type, one message at a time); no gamification, no red except true alerts.

**Screen inventory (what Claude Design will receive):**

A. **Enroll** — photo/upload dropzone → parsing progress (3 named steps) → VERIFY screen (parsed meds table, editable, confidence badges; red-flag cards; confirm button). States: empty / parsing / verify / error-retry.

B. **Clinician Console — Roster** — patient cards: name, day X of 30, condition pack, status dot (ok / flag open / emergency), last check-in summary line, TCM countdown chip ("contact due in 31h"). Sort: flags first.

C. **Clinician Console — Patient detail** (the money screen). Three panes:
   1. Timeline (event feed: calls, wearable summaries, med events, nurse actions — filterable by source);
   2. Flag queue: flag card = severity, one-line finding, evidence accordion (transcript span highlighted, metric sparkline, missed-dose row, PROM score row — condition-specific validated item: KCCQ-12-style for HF, CAT/mMRC-lite for COPD), CONFIRM (opens "call patient" affordance + note field) / DISMISS (reason picker: not clinically relevant / known baseline / data error) — reason picker is the label taxonomy;
   3. Billing tracker: code rows (99495, 99445, 99470) each with status pill pending/satisfied, what satisfies it, running "captured this episode: $X". Include small print "documentation draft ready".
   States: no-flags calm state / open-flag state / emergency state (full-width banner).

D. **Call view** — transcript with speaker turns, symptom findings chips inline, audio player, "agent never diagnoses" footer.

E. **Family view** — hero status ("Margaret sounded well this morning ✓"), med timeline (started/stopped/changed), check-in log, alert banner state. Read-only.

F. **Precision report** (internal/slide-feeding) — synthetic cohort results: precision, recall, confusion counts, one chart. Can be a static page.

**Component inventory for the design system:** PatientCard, StatusDot, FlagCard, EvidenceAccordion, TranscriptSpan(highlight), MetricSparkline, CountdownChip, BillingRow, TimelineEvent, AlertBanner, VerifyMedRow. Build them unstyled-but-structured this weekend (plain Tailwind, semantic markup, all states reachable); Claude Design re-skins tokens/typography/spacing later without structural rewrites.

**Hand-off note for the Claude Design session:** provide this file + screenshots of the working build + the design principles above; ask for a token set (color/type/spacing/radius), the calm-vs-alert visual language, and redesigned FlagCard + Roster first (highest judge exposure).
