import "server-only";
import { supabaseServiceRole } from "@/lib/supabase/serviceRole";

/**
 * Creates (or, on a repeat reseed, finds) a Supabase Auth user for a demo clinician login and
 * keeps its password in sync with the documented demo credential. Auth admin operations are a
 * GoTrue concern, not a Postgres one — they're unaffected by RLS, so calling `.auth.admin.*` here
 * is safe even though this file is only ever used from demo-seeding code (contrast with
 * lib/supabase/serviceRole.ts's `.from()`/data-table warning, which this does not touch).
 */
export async function ensureClinicianAuthUser(email: string, password: string): Promise<string> {
  const admin = supabaseServiceRole();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!createError && created.user) return created.user.id;

  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listError) throw listError;
  const existing = list.users.find((u) => u.email === email);
  if (!existing) throw createError ?? new Error(`Could not create or find an auth user for ${email}.`);

  await admin.auth.admin.updateUserById(existing.id, { password });
  return existing.id;
}
