import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Cookie-bound Supabase client for the current request. Runs PostgREST calls as the logged-in
 * clinician's `authenticated` Postgres role (not the static anon key), so `auth.uid()` resolves
 * inside RLS policies and per-clinician scoping (see migration add_clinician_auth_and_audit_log)
 * actually applies. Only usable from Server Components/Actions/Route Handlers with cookie access.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render (no cookie-write access) — safe to ignore since
          // the middleware refreshes the session cookie on every request anyway.
        }
      },
    },
  });
}
