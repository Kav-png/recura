import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

/**
 * Best-effort access/action audit trail (distinct from the TCM/RPM billing-compliance columns on
 * patients, which record *whether* a required contact happened — this records *who did what*).
 * Never throws: a logging failure must not block the clinical action it's describing. No-ops for
 * the patient portal (no Supabase Auth session there — see proxy.ts), which is intentional; the
 * portal isn't a clinician access path.
 */
export async function logAudit(action: string, opts: { patientId?: string; metadata?: Record<string, unknown> } = {}) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: clinician } = await supabase.from("clinicians").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (!clinician) return;

    await supabase.from("audit_log").insert({
      actor_clinician_id: clinician.id,
      patient_id: opts.patientId ?? null,
      action,
      metadata: (opts.metadata as Json) ?? null,
    });
  } catch (err) {
    console.error(`[audit] failed to log "${action}":`, err);
  }
}
