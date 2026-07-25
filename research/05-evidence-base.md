# Clinical Evidence — For AND Against

## AGAINST (confront first — the thesis-stressor)
- **UPMC ACCOMPLISH RCT** — Yende S, Talisa VB, Mayes K, et al. "Remote Monitoring Approaches to Reduce Readmissions After Infection and Sepsis: A Randomized Clinical Trial." **JAMA Network Open 2026;9(6):e2616641**. n=1,286, 19 hospitals, ~4 yrs, sepsis/LRTI, 4 RPM arms vs usual care. Readmissions 36.3–44.2% vs 37.8% usual care = **no benefit**; among **adults ≥65: monitoring REDUCED days at home and INCREASED readmissions**. Failure mechanism: strong existing usual care left no headroom; symptom detection routed patients to ED where admission bias took over. [A]
- Design lessons encoded in our product: (1) condition-specific targeting (HF/COPD, NOT undifferentiated sepsis/complex elderly); (2) graded respond-at-home protocol, never auto-route-to-ED; (3) measure vs the site's ACTUAL usual care.

## FOR
| Evidence | Finding | Source | Conf |
|---|---|---|---|
| Brigham Hospital@Home RCT (Biofourmis platform) | 7% vs 23% 30-day readmission; −38–40% cost | Annals of Internal Medicine (~n=100, single center, ACUTE substitution model) | A — do not generalize to light-touch BYOD |
| Human post-discharge call program, integrated system | 137,515 calls; 7-day readmission 2.91% (contacted) vs 4.73% (not); 57.9% reached ≤7d | PubMed 37788411 (2023) | A |
| Outpatient follow-up ≤30 days | pooled −21% readmission risk (sig. for HF, stroke) | CDC Preventing Chronic Disease meta-analysis 2024 | A |
| CHF post-discharge interventions | 31 RCTs, n=9,654: hospitalization RR 0.71; mortality RR 0.73; cardiac NURSE presence improved efficacy | PMC8062060 systematic review | A |
| TCM receipt (natural experiment) | mortality 1.0% vs 1.6%; costs $3,033 vs $3,358 | Bindman & Cox, JAMA IM 2018 | A |
| HF telemonitoring | −8.1% readmissions | "2022 CMS trial" via worldmetrics aggregator | C — find primary before citing |
| Med reconciliation post-discharge | reduces adverse drug events | multiple reviews | B |

## Early-warning signature: rising resting HR + falling HRV before HF decompensation
| Evidence | Finding | Source | Conf |
|---|---|---|---|
| MultiSENSE study (n=900, HF patients w/ CRT-D/ICD) | Multisensor index (incl. heart rate, HRV, heart sounds, respiration, thoracic impedance) flagged 70% of impending HF events at a median 34-day lead time before the clinical event | Boehmer et al., JACC Heart Failure 2017 (doi: 10.1016/j.jchf.2016.12.011) | A |
| HeartLogic real-world validation (n=302 HF events) | 75% of events predicted, average lead time 49±40 days | Circulation: Heart Failure / J Cardiac Failure real-world validation studies | A/B |
| Elevated HR + reduced HRV as a component signal | Both track with worsening HF/CAD physiology; used as one input among several in the multisensor index above | multiple HRV-cardiovascular reviews (PMC) | B |

**Caveat for this product**: the studies above validate the HR/HRV-falling signature using *implanted* device sensors (ICD/CRT-D), not a wrist wearable — our voice+wearable design borrows the physiological signature, not a wearable-validated product claim. Pitch copy should describe this as "the same early-warning signature validated in implanted cardiac devices," not imply a consumer-wearable RCT exists; no such trial is sourced here. Treat wearable-specific precision/recall as unproven until our own pilot data exists (see Open evidence gaps below).

## Open evidence gaps
- Published AI-voice-agent completion/acceptance rates in elderly populations: thin, mostly vendor claims [C]. Validate in pilot.
- Wearable home early-warning precision/false-positive benchmarks: no accepted standard; alert precision must be a first-class pilot KPI.
