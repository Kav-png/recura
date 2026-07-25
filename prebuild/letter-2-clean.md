# Letter 2 — clean control (print as plain letter)

St. Marlowe's University Hospital NHS Trust — Discharge Summary (FICTIONAL — demo only)

Patient: Arthur BENNETT (M), DOB 02/11/1958. Admitted 14/07/2026, discharged 18/07/2026.
To: Dr S. Patel, The Elmfield Surgery.

Diagnosis: COPD exacerbation, resolved. Background: COPD (GOLD 2), ex-smoker.

Hospital course: Admitted with increased breathlessness and sputum. Treated with a short course of oral prednisolone and doxycycline, nebulisers weaned to inhalers. Discharged on completed antibiotic/steroid course; usual inhalers unchanged.

Medications on discharge:
- Doxycycline 100 mg OD — NEW, complete 5 days (last dose 22/07/2026)
- Prednisolone 30 mg OD — NEW, complete 5-day course, no taper needed
- Tiotropium inhaler OD — continue
- Salbutamol inhaler PRN — continue

Actions for GP: Routine COPD review in 6 weeks; no action needed unless symptoms worsen.

Expected parse: condition_pack = copd; 2 new time-limited meds, 2 unchanged, ZERO danger flags (a "warn: new antibiotic/steroid, finish the course" info flag is acceptable; anything severity=danger is a false positive — fix the prompt). This is the Block F "no-false-alarm" letter — it exists to prove the COPD rule pack doesn't cry wolf.
