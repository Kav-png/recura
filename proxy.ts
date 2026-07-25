import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SESSION_COOKIE, isValidSessionToken, PATIENT_SESSION_COOKIE, verifyPatientSessionCookie } from "@/lib/auth";

// Two different actors, two different gates:
// - /patient/:path* is the patient's own portal (no clinician account — a real patient never has
//   one). Two ways in: the shared practice access code (demo/staff convenience — opens the "choose
//   your name" picker and any patient), or a patient's own individual access_code (see
//   lib/patientAccessCode.ts), which is scoped to exactly one /patient/[id] and nothing else —
//   no picker, no other patient's chart, even by direct URL.
// - Everything else here (/doctor, /practice, /settings) is clinician-facing and requires a real,
//   per-clinician Supabase Auth session so RLS can scope patient visibility by clinician_id.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/patient")) {
    const scopedPatientId = verifyPatientSessionCookie(request.cookies.get(PATIENT_SESSION_COOKIE)?.value);
    if (scopedPatientId) {
      const ownPath = `/patient/${scopedPatientId}`;
      return pathname === ownPath ? NextResponse.next() : NextResponse.redirect(new URL(ownPath, request.url));
    }

    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!isValidSessionToken(token)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() (not getSession()) re-validates the token against Supabase Auth on every request —
  // required here since this is the trust boundary that gates the clinician-facing surfaces.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/doctor/:path*", "/practice/:path*", "/patient/:path*", "/settings/:path*"],
};
