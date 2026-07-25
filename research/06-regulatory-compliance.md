# Regulatory & Compliance

## FDA — Clinical Decision Support boundary
- Governing: FDCA §520(o)(1)(E) four criteria + FDA CDS Final Guidance (Sep 2022), **revised Jan 6, 2026** (clarifying, not deregulatory — Covington analysis). Non-device CDS iff: (1) does NOT analyze medical images / IVD signals / signals from signal-acquisition systems; (2) analyzes "medical information" (symptoms, discrete results, discharge summaries); (3) recommendations go to an HCP; (4) HCP can independently review the basis (no primary reliance). [A]
- Design consequences: analyzing RAW wearable signals (PPG/ECG waveforms, continuous SpO2 patterns) → likely SaMD/510(k). Analyzing DISCRETE values + symptoms + letter data with clinician-reviewable reasoning → can stay non-device CDS. Patient/caregiver-directed outputs generally forfeit the exemption → alerts phrased as care-team notifications; family gets non-diagnostic nudges.
- Cleared comparators operating as devices: Biofourmis Biovitals (exacerbation prediction), Current Health Class II platform.

## Apple Watch
- FDA cleared Apple "Hypertension Notification Feature (HTNF)" — 510(k) **K250507, Sept 11, 2025**. Screening/notification (30-day passive pattern, validated >2,000-participant study) — NOT diagnosis, NOT continuous clinical BP. Legitimizes BYOD signals for triage-level use. [A]

## HIPAA — messaging channels
- **WhatsApp: Meta will NOT sign a BAA; Business Terms disclaim healthcare use → sending PHI via WhatsApp is non-compliant in the US.** [B — TeachMeHIPAA, ComplyAssistant]
- Compliant alternatives: Twilio (signs BAA), TigerConnect, Spruce, Klara. Or send non-PHI nudge ("please call the care line") on any channel.
- Product decision on file: WhatsApp/Telegram = hackathon demo theater only; US production alerts = Twilio-with-BAA or equivalent.

## Calls & consent
- TCPA: automated/prerecorded calls & texts need prior express consent; healthcare-message treatment exists but 2026 consent rules tightening → capture explicit consent at enrollment, honor revocation. [B]
- AI check-in calls & state licensure: non-diagnostic scripts + escalation to clinicians licensed in patient's state; agent must never diagnose/advise treatment.

## WhatsApp Cloud API mechanics (for the DEMO only; see prebuild/whatsapp-template.md)
- Business-initiated messages require Meta-approved TEMPLATE (utility category reviews in minutes–24h via Twilio); free-text only within 24h user-initiated session; test number auto-created with new Cloud API app. [B]
