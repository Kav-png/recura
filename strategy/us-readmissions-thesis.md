# US Readmissions Thesis — The Detection Layer for the 30 Days After Discharge
### Strategy memo · researched 22 July 2026 · pairs with the hackathon build in ../blocks

## One-line identity
Not SaaS. A clinical detection layer for the post-discharge episode: voice check-ins + consumer wearables + medication signals, triaged by ML, escalated to clinicians — sold to hospitals as readmission prevention, monetised twice (hospital episode fee + enabling TCM/RPM billing capture).

---

## 1. Why the money is real (the hospital's P&L)

- HRRP penalty: up to 3% of ALL Medicare fee-for-service payments (not just readmission payments). FY2024: 2,583 hospitals penalised, avg $217K; a $100M-Medicare-revenue hospital can lose up to $3M. 93% of eligible hospitals penalised at least once since 2013.
- FY2026: penalties RISING for the first time in five years — 240 hospitals (8.1%) at ≥1%.
- Direct cost is the bigger lever: ~$52.4B/yr total US 30-day readmission cost; ~$13,200 avg per readmission; Medicare ~$26B/yr of which ~$17B avoidable.
- HRRP conditions: AMI, heart failure, pneumonia, COPD, hip/knee replacement, CABG. Heart failure AND COPD = the beachhead service lines, together — HF 23% 30-day readmission rate (~1.3M hospitalisations/yr), COPD ~20% (~650K/yr). Both are the two conditions where the UPMC negative result (§3) applies most directly and condition-specific detection has the clearest edge over generic monitoring.
- ROI pitch to CFO: at ~$200/episode fee, preventing 1 readmission in ~65 monitored episodes breaks even on direct cost alone, before penalty exposure. Realistic prevention rates make this a >5x ROI story.

## 2. Why NOW (the Jan 2026 unlock — lead with this)

- CMS 2026 Physician Fee Schedule added CPT 99445: RPM device supply for only 2–15 days of data per 30-day period (~$47) — before this, the 16-day floor made short post-discharge episodes largely unbillable. Also new 99470: first 10 minutes of management time (~$26).
- TCM codes 99495 (~$201) / 99496 (~$273): one-time per discharge; REQUIRE patient/caregiver contact within 2 business days of discharge (phone counts) + face-to-face within 14/7 days + medication reconciliation. Famously under-billed because timing + documentation rules are fiddly.
- RPM and TCM are billable in the SAME service period.
- Stack per 30-day episode: TCM ($201–273) + 99445 ($47) + 99470/99457 ($26–52) ≈ $274–372 of reimbursement our product generates and auto-documents.
- Therefore the physician-workflow answer: "It does not add to your workload. The agent makes the 2-day contact, collects the RPM data, writes the documentation, and captures reimbursement you're currently leaving on the table. Your team only sees triaged, confirmed signals."
- Incumbents built their billing engines around the old 16-day world; a product designed natively for 99445 episodic monitoring is a fresh lane. This window is months old.

## 3. The evidence — including the negative result (our moat argument)

- Biofourmis/Brigham (~100 pts, hospital-at-home context): 70% lower 30-day readmissions, 38% lower cost — WITH a full clinical command centre behind the sensors.
- UPMC sepsis trial (19 hospitals, 1,286 patients): post-discharge remote monitoring INCREASED readmissions. Naive monitoring → false alarms → panicked ER visits → admissions.
- Synthesis: monitoring is not the product; TRIAGE PRECISION is the product. The market has proven both that this works with intelligence behind it and fails without it.
- Design consequence: measure and publish alert precision/recall from day one. Pilot primary metric = positive predictive value of escalations, not just readmission delta.

## 4. The data moat (detection company, not software company)

- Proprietary asset: multimodal episodes — voice-reported symptoms (transcripts) + wearable vitals (HR, HRV, steps, sleep; BP as watches add it) + medication adherence — LABELLED with outcomes: readmitted y/n, ER visit y/n, and every clinician confirm/dismiss on every alert.
- The confirm/dismiss loop is the engine: each nurse action is a training label on a real-world alert. False positives and false negatives accumulate into a triage model nobody can shortcut without years of clinical deployment.
- De-identified at the layer boundary → the dataset improves detection for every hospital; per-condition baselines (post-HF-discharge "normal" vs this patient's deviation) compound.
- Cold start answer: begin with rule-based + published early-warning criteria (condition-specific red flags, NEWS2-style logic) + per-patient baselines from the wearable's first 72h; ML replaces rules as labels accumulate. Honest sequencing, and what a clinical buyer wants to hear anyway.
- Setup friction target: patient side = install app, grant HealthKit/Health Connect, confirm med list photographed from discharge letter, one test call. <10 minutes at bedside before discharge, done by the TCM-billing practice's staff (they're paid to).

## 5. Why the giants don't do this

- Apple: has fall detection, AFib, (soon) BP — but no clinician connection, no escalation pathway, no reimbursement capture, no outcome labels (Apple never learns you were readmitted), population-generic algorithms, and zero appetite for medical liability. Apple is our SENSOR, not our competitor.
- Epic: readmission risk scores at discharge exist but are static, claims-based, and end at the door. Epic sells software to hospitals; it does not operate post-discharge patient engagement. We are the operator that writes back into Epic.
- Biofourmis/CoPilotIQ, Current Health (Best Buy), Cadence, HRS: enterprise-heavy — shipped device kits, 24/7 command centres, employed clinicians, long deployments, big contracts. They cannot profitably serve the mid-market hospital with a $200K penalty. Voice-first + patient's own devices + week-one deployment is the light end they structurally ignore. Cadence also runs its OWN clinicians (a service company); we keep the hospital's clinicians in charge (a detection layer) — different trust posture, different margin structure.

## 6. Doctor trust — the sequenced answer

1. Launch posture: clinical decision SUPPORT + documentation assistant. The system surfaces, explains, and documents; a human clinician always decides. This keeps us on the safe side of FDA SaMD (non-device CDS) and is the honest capability level anyway.
2. Everything auditable: every alert shows its inputs (transcript snippet, vitals trace, missed-dose signal). No black boxes at the bedside.
3. Publish our false-positive rate to the buyer, quarterly. The UPMC story is our sales slide: "monitoring without triage makes things worse — here is our precision."
4. Escalation is conservative and asymmetric: severe symptoms → "call 911 / attend ED" + notify care team; the system NEVER tells a patient not to seek care. Doctors can always call the patient in; we give them the data to justify it.
5. Physician champion model: land via the cardiology / HF service line lead whose readmission numbers are on the hospital scorecard.

## 7. Relationship to Juno (say this to the judges)

- Juno: chronic illness self-management, consumer-paid, patient-initiated, longitudinal. Us: acute 30-day episode, hospital-paid, clinician-in-the-loop, terminating.
- Complementary by construction: day 31, the graduated patient hands off to a Juno-style companion with a clean, structured episode record; Juno-style daily data could be an upstream signal into our detection during future admissions.
- Positioning line: "We're the acute care module for the moment chronic illness turns into a hospital bed — the 30 days Juno's users fear most."
- Also viable standalone: different buyer (hospital vs consumer), different reimbursement, different regulatory posture → genuinely a separate company, partnership-shaped.

## 8. Why me

- Day job: anomaly detection on noisy time series in a heavily regulated environment. Baseline → deviation → signal-vs-noise → escalation is literally the quant workflow; the label changes from a trade to a readmission.
- Prior proof: multi-model document intelligence system (2nd company-wide) → discharge letters are the entry document.
- Production mindset in a compliance-first industry → the right instincts for healthcare's audit/trust demands.
- One line: "I detect anomalies for a living in a domain where false signals cost money. In this domain they cost lives — same maths, higher stakes."

## 9. Business model + GTM sequence

- Phase 0 (hackathon): consumer-visible demo (letter → calls → alert) + this thesis as the roadmap. Prize target + YC interview narrative.
- Phase 1: 1 hospital, HF **and** COPD service lines together (not sequential — the evidence supports both from day one), 50–100 discharges, physician champion, pilot priced ~$150–250/episode or free-with-data-rights; primary metrics = alert precision + TCM/RPM capture uplift (fast, billable, provable) with readmission delta as the headline secondary.
- Phase 2: 3–5 mid-size hospitals with ≥1% HRRP penalties (public CMS data = literal target list); deepen HF/COPD before considering additional HRRP conditions (AMI, CABG).
- Phase 3: detection layer as the product — per-episode platform fee + % of enabled billing capture; dataset network effects; Epic write-back integration.
- Deliberate non-goals early: no owned clinical staff (stay a layer, not a service company), no shipped hardware kits, no chronic long-term monitoring (that's Juno-land).

## 10. Kill criteria / honest risks

- FDA: if we can't stay within non-device CDS while being useful, timeline changes materially → decide posture with regulatory advice before Phase 1 claims are written.
- Sales cycle: if pilot #1 takes >9 months to sign, pivot buyer to TCM-billing physician groups / ACOs (faster, revenue-motivated, same product).
- Evidence: if pilot alert precision is poor and not improving with labels, the UPMC failure mode is ours — stop before scaling.
- Adoption: if bedside enrolment <40% of offered patients, the setup flow (not the ML) is the company's real problem — fix or die there.
- Incumbent response: Cadence/HRS moving down-market with a voice-first light product is the credible threat; our speed + label dataset + 99445-native design is the defence, and it only holds if Phase 1 starts fast.
