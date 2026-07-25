# Company Operating Model & Engineering Architecture
### Companion to us-readmissions-thesis.md · figures sourced in ../research/

## A. The operating loop (per discharged patient)
Actors: patient · family contact · practice nurse (the billing human) · physician · paying org (physician group/ACO first; hospital second) · us.

1. **Day 0 — bedside enrollment (<10 min, done by the practice's own staff):** photograph discharge letter → parsed to structured episode record (meds+changes, diagnoses, red-flag watchlist, follow-ups); connect HealthKit/Health Connect; capture TCPA + monitoring consent; confirm family contact.
2. **Days 1–30 — AI volume, human billable minute:** daily voice check-in (meds, symptoms, wellbeing) + discrete wearable metrics → triage engine → one of: all-clear (logged), FLAG (nurse queue with evidence: transcript snippet, vitals trend, missed dose), EMERGENCY (call instructs 911/999; family + care team notified). Nurse confirms (calls patient = live interactive touch supporting RPM billing) or dismisses → every action is a training label. System runs the TCM clock: tees up mandatory human contact ≤2 business days, schedules 7/14-day F2F, drafts documentation. LEGAL CONSTRAINT (research/03): CMS excludes chatbots from the TCM contact; RPM mgmt needs live interactive communication → "AI does 90%, nurse does the billable minute" is the only compliant shape, and the doctor-trust shape.
3. **Day 30 — graduation + billing package:** auto-assembled claims: 99495/96 (~$201–273) + 99445 (~$47) + 99470/99457 (~$26–52) ≈ $274–372 practice revenue (captured today on <18% of eligible discharges). Our fee ~$75–100/episode → buyer nets ~$200+ positive per discharge. We sell FOUND REVENUE, not cost avoidance; readmission/mortality benefit rides on the same codes (Bindman & Cox: 1.0% vs 1.6% mortality).
4. **Flywheel:** confirm/dismiss labels + 30-day outcome ground truth → outcome-labelled multimodal dataset that only exists inside deployed clinical workflow → trains specialised triage models → the defensibility answer to the 16-minute clone.

**What we are NOT:** a clinical services company. No owned nurses (vs Cadence), no command centres (vs Biofourmis), no shipped kits. Software + detection + billing-ops layer; buyer's clinicians stay in charge; therefore viable for the mid-market incumbents can't reach.

## B. Engineering architecture (5 layers; commodity vs core marked)

**L1 Ingestion — commodity, harden it:**
- Document intelligence: letter → episode JSON with per-field confidence + mandatory human-verify at enrollment (mis-parsed dose = safety event).
- Voice: ElevenLabs conversational agent, per-patient context injection, transcript capture, constrained scripts (never diagnose/reassure; severe symptoms → emergency script only).
- Wearables: HealthKit/Health Connect, **DISCRETE VALUES ONLY** (resting HR, HRV summary, steps, sleep, BP readings). Never raw PPG/ECG waveforms — raw-signal analysis ⇒ FDA device; discrete values + clinician review ⇒ non-device CDS (research/06). The FDA boundary is a schema decision.

**L2 Episode record — foundation:**
- Event-sourced timeline per episode; every datum carries source (letter|call|wearable|nurse), timestamp, confidence. Load-bearing for: CDS criterion 4 (clinician can audit alert basis), Medicare billing audits, ML lineage.

**L3 Detection/triage engine — CORE TECHNOLOGY, staged:**
- V1 (no ML): per-patient baselines from first 72h wearable data; condition-specific rule packs (HF ≠ COPD); LLM symptom extraction from transcripts + condition-specific PROM score (KCCQ-12-style for HF, CAT/mMRC-lite for COPD) → structured findings; scoring = baseline deviation + symptom severity + PROM + adherence → flag/no-flag + plain-language explanation.
- V2: ML trained on accumulated confirm/dismiss + outcome labels, replacing rule packs as measured precision beats them.
- KPI = PRECISION, not recall (UPMC: low-precision monitoring harms). Ship alert budgets per nurse + continuous false-positive dashboards as product features.

**L4 Workflow + billing state machine — the unglamorous moat:**
- TCM rules as code: 2-business-day countdown, 7 vs 14-day F2F scheduler, once-per-30-day constraint, not-billable-if-readmitted.
- RPM/RTM constraints as code: 99445 XOR 99454; 99470 XOR 99457; minute tracking for management codes; ≥1 live interactive comm verified.
- Auto-drafted compliant documentation; month-end claims assembly; full audit trail. This layer is WHY 82% of TCM goes unbilled — the fiddly rules are the product. Zero hackathon teams build this.

**L5 Comms + compliance rails:**
- Telephony + family alerts: Twilio with BAA (WhatsApp = demo theatre only; Meta signs no BAA — research/06). Non-PHI nudges permissible on any channel.
- Consent mgmt with revocation (TCPA); PHI-scoped access; audit logs; de-identification pipeline feeding the research dataset.
- Later: FHIR/EHR write-back (Epic) — deferred, but schema anticipates it now.

## C. Where the unique engineering lives (the answer to "any uniqueness in your build?")
1. Labelling loop invisible inside the nurse's normal workflow (confirm/dismiss = zero extra clicks).
2. Precision-first triage with per-patient baselines (quant skillset applied: baseline → deviation → signal-vs-noise → asymmetric costs).
3. The reimbursement state machine (TCM/RPM timing + exclusivity rules as code).
4. Audit-grade provenance layer.
The voice agent and dashboard — the impressive-looking parts — are commodity. Say so in the pitch.

## D. Synthetic-data study (Jay's suggestion → hackathon science spine)
Generate a 100-patient synthetic post-discharge cohort: wearable traces with embedded deterioration events (e.g., HF decompensation = rising resting HR + falling HRV over 4 days; silent non-adherence pattern; benign noisy controls). Run V1 triage over it; report precision/recall on one slide. Upgrades the demo from "voice agent app" → "detection technology with measured performance."
Build note: cohort generator = deliberate event injection into realistic baselines (per-patient noise, circadian patterns); hold out 20% for the headline numbers; publish the generator script in the repo for judge scrutiny.

## E. Hackathon build ↔ company mapping
- Hackathon proves: L1 (letter parse, voice call), L5 demo path (alert to phone), toy L3 (rule-based flag), + synthetic-data precision slide.
- Company requires: L2, full L3, L4, compliance rails, reimbursement-counsel sign-off, pilot with an at-risk physician group (HF/COPD beachhead — research/05 discipline).
