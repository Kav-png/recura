import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Bypasses RLS — reserved for trusted server-only paths that must touch real
 * (is_demo=false) patient data: enrollment, the ElevenLabs call webhook, and
 * the risk-scoring job. Never call `.from()`/`.rpc()` on this client from the
 * browser or from demo-data code paths.
 *
 * Exception: `.auth.admin.*` methods (used by lib/clinicianAuth.ts to provision demo clinician
 * logins) are a GoTrue concern, not a Postgres one, and are unaffected by RLS — calling those
 * from demo-seeding code does not violate the rule above.
 */
export function supabaseServiceRole() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured — real (is_demo=false) data paths are unavailable until it's set in .env.local."
    );
  }
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
