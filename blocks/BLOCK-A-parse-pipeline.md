# Block A — Parse Pipeline (Sat 11:00–13:00)

## Objective
Photo/upload of a discharge letter → Claude vision → structured JSON → Supabase → rendered results page. This is the front door of the whole demo.

## Starting state (from pre-build)
- Deployed Next.js skeleton on Vercel, Supabase tables created
- Working parse prompt iterated in a notebook against 3 mock letters (letter-1-hf.html is THE demo asset — heart failure, matches the HF/COPD beachhead)
- Anthropic API key in Vercel env vars

## Tasks in order
1. `/upload` page: file input (mobile camera capture enabled: `capture="environment"`), preview, submit.
2. Server route `POST /api/parse`: image → base64 → Anthropic API with the pre-built prompt → validate JSON (zod). Retry once on malformed JSON with a "return ONLY valid JSON" nudge.
3. Persist: insert into medications + red_flags for the demo patient. Wipe-and-replace on re-parse (idempotent demo).
4. `/letter` results page: med list grouped by status (new/changed/stopped highlighted), red flag cards (danger = red, with plain-English explanation), and the plain-English summary block at top.
5. Loading state that looks intentional (parse takes ~10–25s): step indicator "Reading letter → Checking medications → Checking interactions".

## Output JSON contract (do not change without updating Block B/D)
{ patient_name, medications: [{name, dose, frequency, status, reason}], red_flags: [{severity, title, explanation_plain_english}], plain_english_summary }

## GATE 1 — 13:00
Letter 1 parses end-to-end in the DEPLOYED app (not localhost), red flag detected, < 30s.

## FALLBACK (implement immediately if gate fails)
Hardcode letter 1's known-good JSON behind the upload button (still show the loading steps, still write to Supabase). Flag file `WIZARD_OF_OZ=true` in env so we remember. Revisit only if Blocks B–E are all green.

## Do NOT
- Support PDFs, multi-page letters, or letters 2/3 in the UI (letter 2 is a Block F stretch)
- Build any editing/correction UI for parsed meds
- Add auth, patient selection, or onboarding
