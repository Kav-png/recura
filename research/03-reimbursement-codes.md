# Reimbursement — TCM / RPM / RTM (2026)

## RPM code family (2026 national averages; vary by locality; verify before billing claims)
| Code | What | Rate | Notes | Source |
|---|---|---|---|---|
| 99453 | Setup + patient education (one-time) | ~$22 | once per episode of care | Tenovi, Prevounce, Advanta [B] |
| 99454 | Device supply, 16+ days data / 30d | ~$47–52 | mutually exclusive with 99445 | same [B] |
| **99445 (NEW Jan 2026)** | Device supply, **2–15 days** data / 30d | ~$47–52 (equal to 99454) | CY2026 MPFS Final Rule; built FOR short transitional episodes | CMS via Tenovi/ThoroughCare/Advanta [A/B] |
| 99457 | First 20 min mgmt/mo, ≥1 live interactive comm | ~$52 | calendar-month code | [B] |
| 99458 | Each addl 20 min | ~$41–52 | add-on to 99457, unlimited increments | [B] |
| **99470 (NEW Jan 2026)** | First **10 min** mgmt/mo, ≥1 live interactive comm | ~$26 | cannot combine with 99457 | CMS via same [A/B] |
| Max stack | 99454+99457+2x99458 ≈ **$181/pt/mo**; light stack 99445+99470 ≈ **$73/pt/mo** | | | Advanta [B] |
| Panel economics | 100 RPM patients ≈ ~$188K/yr practice revenue | | | rcmaxis [C] |

## TCM
| Code | What | Rate | Source |
|---|---|---|---|
| 99495 | Moderate MDM; contact ≤2 business days; F2F ≤14 days; med reconciliation | ~$201 | CMS PFS via ThoroughCare/HealthArc [A/B] |
| 99496 | High MDM; F2F ≤7 days | ~$273 | same |
- Once per patient per 30-day post-discharge period; billed at period end; not billable if readmitted. TCM + RPM billable in SAME period. RPM + RTM NOT billable together.

## RTM (98975–98981) — possibly the better rail for voice-reported symptoms
- Permits SELF-REPORTED, non-physiologic data (symptoms, adherence, respiratory/MSK status) — unlike RPM which needs device-generated physiologic data. 2026 added episodic codes 98984/98985 (2–15 days) and 98979 (10–19 min). Mgmt codes 98980/98981 require live interactive communication; 2026 "sometimes therapy" modifier rules apply. [B — CCNHealth, HRS cheat-sheet]

## TCM under-capture (the wedge stat)
| Fact | Value | Source | Conf |
|---|---|---|---|
| Eligible Medicare discharges with TCM billed, 2019 | **17.9%** | ASPE/PTAC Final Report, June 2023 | A |
| TCM billing 2013→2015 | 3.1% → 5.5% → 7.0% of 18,756,707 eligible discharges | Bindman & Cox, JAMA Internal Medicine 2018 | A |
| TCM receipt → outcomes | total cost $3,033 vs $3,358; mortality **1.0% vs 1.6%** (days 31–60 post-discharge) | Bindman & Cox 2018 | A |

## ⚠️ AI-eligibility rules (product-defining)
- TCM 2-day "interactive contact": Noridian (CMS MAC): "direct contact does not include digital assistants such as chat bots, Siri, or Alexa" — must be physician/QHP/clinical staff. **AI cannot make the billable TCM contact.** [A/B]
- RPM/RTM "interactive communication": CMS 2021 definition = real-time synchronous two-way audio; CY2026 Final Rule declined to bless automated messaging/AI when asked; CPT manual requires "live, interactive communication". **Design = AI does the volume work; clinician performs the billable live touch.** [A/B]
- ACTION ITEM: obtain written reimbursement-counsel opinion before making billing claims to customers/investors.

## Diagnosis codes for superbill generation
Standard CMS ICD-10-CM tabular list codes (not a statistic — the official code set itself), used as the "unspecified" default per condition on generated billing documents pending real clinical coding by practice staff: HF → I50.9 (heart failure, unspecified); COPD → J44.9 (COPD, unspecified); AMI → I21.9 (acute MI, unspecified); Pneumonia → J18.9 (pneumonia, unspecified organism). Source: CMS ICD-10-CM Official Tabular List (annual release). [A] These are placeholders on the generated document, not a coding recommendation — real diagnosis coding is the billing clinician's responsibility.

## Documentation & audit-trail requirements (what CMS/MAC auditors actually check)
Not a rate/statistic — these are the medical-record elements CMS's TCM/RPM/RTM billing guidance and the CPT manual require on file to substantiate a claim under audit, distinct from and in addition to the AI-eligibility rules above. [B — general CMS TCM/RPM billing-guidance knowledge; no single primary citation, cross-check with reimbursement counsel per the ACTION ITEM below before customer-facing use]
- **TCM (99495/99496)**:
  1. Discharge date + source (inpatient/SNF/observation).
  2. The interactive contact: date, method (must be live), and clinician name/credential. If the first attempt fails, ≥2 documented attempts are expected before the 2-business-day window closes.
  3. **Medication reconciliation** — its own documented element, completed by the date of the F2F visit; the live contact alone does not make the service billable without it.
  4. The F2F visit: date, and an E/M note whose **medical-decision-making (MDM) level** (moderate vs. high) is what CMS actually keys 99495 vs 99496 off — not the F2F day-count alone (the day count is a timing requirement, not the complexity determinant).
  5. Care-plan elements: discharge-summary review, coordination with other treating providers, patient/caregiver education, scheduling of follow-ups, community-resource assessment.
  6. Single-biller rule: only one practitioner bills TCM per patient per period.
- **RPM/RTM (99445/99454/99457/99470)**:
  1. Patient consent to remote monitoring (on file, renewed yearly).
  2. Device order tied to the diagnosis.
  3. Device-day transmission log (drives 99445 vs 99454 code selection).
  4. The live interactive touch: date, method, clinical staff name, **and a duration log** — this is what distinguishes 99457 (≥20 min) from 99470 (10–19 min); CMS/CPT do not treat these as interchangeable defaults.
- **General posture**: auditors want contemporaneous, timestamped chart entries naming the specific clinician who performed each required element — a system-generated "captured" flag with no underlying note is not, by itself, audit-defensible.
- Product implementation: `lib/billing.ts#computeExpectedBilling` gates TCM "captured" status on medication reconciliation being logged (not just the live contact), selects 99495/99496 from a clinician-documented MDM level (`tcm_mdm_level`, falling back to the F2F-day heuristic only when no level has been recorded), and selects 99457 vs. 99470 from a logged RPM contact duration (`rpm_live_contact_minutes`) rather than always defaulting to the 10-minute code.

## Why capture stays low even though the codes exist (the automation gap)
The codes and rates above have existed for years, yet TCM capture sits at 17.9% (see under-capture table above) because the work is a live-clinician-time bottleneck, not a data problem: someone has to make and document (a) a synchronous 2-day contact per discharge, within a hard deadline, and (b) a synchronous monthly RPM/RTM touch, per the AI-eligibility rules above — and today that documentation is usually manual (EHR free text or a spreadsheet), so it's easy to let the deadline lapse or forget to file the claim. The product's automation opportunity is therefore narrow and specific: AI can (1) do all the non-billable volume work (daily check-ins, symptom capture, device-day ingestion, scheduling the F2F, drafting the note), and (2) turn the clinician's live touch into a one-click logged event that deterministically computes the correct CPT code/status and renders a submittable billing document — but it cannot perform or fabricate the live contact itself. That's the design implemented in `lib/billing.ts` / `lib/billingDocument.ts`.
