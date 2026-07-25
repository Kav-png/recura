# YC Interview Prep — 10-Minute Rapid-Fire
YC interviews are ~10 minutes, interruption-heavy, clarity-obsessed. One-breath answers, numbers ready, no hedging. Figures → ../research/.

## The one-liner (memorise)
"Nurse-supervised AI for the 30 days after hospital discharge: our voice agent and detection engine catch heart-failure and COPD deterioration early, our billing layer captures the ~$300 per discharge Medicare already pays that goes unbilled on 82% of eligible discharges — not because hospitals don't want it, because the contact-window and documentation rules are hard to hit by hand."

## Rapid-fire Q&A
- **What do you do?** → the one-liner.
- **Who's using it?** → "Nobody yet — built [X] weeks ago, won [hackathon]. August: concierge pilot, ten post-discharge families monitored manually; September: first physician-group pilot via our clinical advisor's network, measuring alert precision and TCM capture uplift."
- **How do you make money?** → "$75–100 per 30-day episode. The buyer bills $274–372 in TCM/RPM — codes that require a live clinician contact within a 2-day window plus documentation, which is exactly why only 17.9% of eligible discharges get billed today (ASPE/PTAC 2023). We don't change the rules, we make hitting them automatic — we're self-funding for the buyer, net +$200/discharge, and the same loop that captures the revenue is what catches the deterioration."
- **Why now?** → "Three dated facts: Jan 2026 CMS codes made 2–15-day monitoring billable for the first time; Sept 2025 FDA cleared Apple Watch cardiovascular detection; voice AI hit human-quality at pennies per call in 2025."
- **Why won't Apple/Epic do this?** → "Apple has no clinicians, no reimbursement capture, no outcome labels, no liability appetite — Apple is our sensor. Epic scores risk at discharge and stops at the door; we're the operator that writes back into Epic."
- **Why not just a cheaper pure billing-automation tool, and skip the clinical layer?** → "Because that tool already half-exists and it's not the wedge — TCM documentation software gets you the paperwork done faster, it doesn't catch the patient before they're readmitted, so the hospital's other cost (the readmission itself, and the HRRP penalty) is untouched. The clinical RPM players who DO detect deterioration — Cadence, HRS, Biofourmis — are capital-heavy, kit-based, chronic-focused, and none of them are built around the 2–15-day post-discharge codes that only went live in January. Nobody's combined voice-agent-first detection with automatic capture of THIS specific billing window. That's the first-mover gap." (see `research/04-competitors.md`)
- **What's the moat?** → "Every clinician confirm/dismiss on every flag, tied to a real 30-day outcome. A condition-specific labelled detection dataset that only accumulates inside deployed clinical workflow. Software's clonable in 16 minutes — I watched a doctor do it. The labels aren't."
- **Biggest risk?** → "Enrollment at the discharge door. If <40% of offered patients enrol, the flow is the company's real problem. That's what the concierge pilot tests first."
- **Why you?** → "I build anomaly detection on noisy time series in regulated finance. Same maths — baseline, deviation, asymmetric costs — the signal is a decompensating heart instead of a moving market."
- **The negative evidence?** (they may know UPMC) → "The biggest RCT showed indiscriminate monitoring of elderly sepsis patients INCREASED readmissions — that's why we're condition-specific (HF/COPD), precision-first, with respond-at-home protocols. The null result is our design spec."
- **Isn't this medical advice / FDA?** → "Non-device CDS by design: discrete values and symptoms, never raw waveforms; clinician sees the evidence and decides; system never diagnoses. SaMD is the roadmap after the dataset, not the launch."
- **Solo founder?** → honest current answer + what you're doing about it (advisor, team formation, hiring plan). Do not bluff a cofounder.

## Gaps to close BEFORE any YC interview (post-hackathon sprint)
- [ ] 10-family concierge pilot live (traction sentence must be true)
- [ ] Jay formalised as clinical advisor (named, agreed)
- [ ] 1 physician-group/ACO conversation with named contact; aim for an LOI
- [ ] Reimbursement counsel informal read on the human-in-loop billing design
- [ ] Precision numbers from real (consented) episodes, not just synthetic
- [ ] Team decision made deliberately: solo with advisors vs recruited cofounder

## Event compliance notes (from Jul 2026 T&Cs)
- Synthetic/anonymised/authorised data ONLY. Our letters are fictional; synthetic cohort compliant. **Tadia's real discharge summary: written consent + full anonymisation, or rebuild as a fictionalised equivalent preserving clinical content. Default: fictionalise.**
- Never present as medical advice/diagnosis — already our safety rail; quote the clause in the pitch.
- IP stays ours; organisers get display rights for judging/promo only.
- Attend Marshall's UX talk Sat 3:00–3:20 — he's judging; reflect his stated values in the clinician console.
