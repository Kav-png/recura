// Shared identifiers for the two seeded demo clinician accounts (see lib/demoData.ts, which
// provisions/reseeds them, and lib/actions.ts's submitAccessCode, which uses the admin one as the
// shared-code shortcut into the clinician-facing surfaces). Kept in one place so the email/password
// used to actually sign in doesn't drift from what's seeded.
export const DEMO_ADMIN_EMAIL = "maria.alvarez@demo.recura.health";
export const DEMO_NP_EMAIL = "chidinma.obi@demo.recura.health";

// Demo-only credential for both seeded clinician logins (documented in README.md). Not a secret in
// any meaningful sense — it only ever gates fictional demo data (CLAUDE.md: "No real patient data
// anywhere. Demo data only.") — but kept in an env var rather than inlined so it's one place to change.
export const DEMO_CLINICIAN_PASSWORD = process.env.DEMO_CLINICIAN_PASSWORD ?? "recura-demo-2026";
