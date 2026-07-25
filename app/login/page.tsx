import { submitAccessCode, signIn } from "@/lib/actions";
import { Logo } from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const isPatientPortal = next?.startsWith("/patient") ?? false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8">
        <Logo className="w-11 h-11 rounded-[11px] mb-5" />
        <div className="font-heading font-extrabold text-xl mb-1">Recura</div>

        {isPatientPortal ? (
          <>
            <div className="text-sm text-muted mb-6">Discharge Safety Net · Enter the practice access code to continue.</div>
            <form action={submitAccessCode} className="flex flex-col gap-3">
              <input type="hidden" name="next" value={next ?? "/patient"} />
              <div>
                <div className="text-xs font-semibold text-muted mb-1.5">Access code</div>
                <input
                  name="code"
                  type="password"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                  placeholder="Enter code"
                />
              </div>
              {error && <div className="text-[12.5px] text-critical">That code isn&apos;t right. Try again.</div>}
              <button
                type="submit"
                className="mt-2 px-4 py-2.5 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </form>
            <a href="/login?next=%2Fdoctor" className="block mt-4 text-[12.5px] text-muted hover:text-foreground text-center">
              Clinician? Sign in with your account instead →
            </a>
          </>
        ) : (
          <>
            <div className="text-sm text-muted mb-6">Discharge Safety Net · Sign in with your clinician account.</div>
            <form action={signIn} className="flex flex-col gap-3">
              <input type="hidden" name="next" value={next ?? "/doctor"} />
              <div>
                <div className="text-xs font-semibold text-muted mb-1.5">Email</div>
                <input
                  name="email"
                  type="email"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                  placeholder="you@practice.com"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted mb-1.5">Password</div>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                  placeholder="Enter password"
                />
              </div>
              <button
                type="submit"
                className="mt-2 px-4 py-2.5 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-border" />
              <div className="text-[11px] text-muted">OR</div>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Demo shortcut: signs in as the admin clinician account, same as email/password
                above — not a second auth system, just one code to remember for a live demo. */}
            <form action={submitAccessCode} className="flex flex-col gap-3">
              <input type="hidden" name="next" value={next ?? "/doctor"} />
              <div>
                <div className="text-xs font-semibold text-muted mb-1.5">Demo access code</div>
                <input
                  name="code"
                  type="password"
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                  placeholder="Enter code"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-[10px] border border-border text-[13.5px] font-semibold hover:bg-muted-bg transition-colors"
              >
                Continue with access code
              </button>
            </form>

            {error && (
              <div className="text-[12.5px] text-critical text-center mt-3">
                That wasn&apos;t right — check your email/password or access code and try again.
              </div>
            )}

            <a href="/login?next=%2Fpatient" className="block mt-4 text-[12.5px] text-muted hover:text-foreground text-center">
              Patient? Enter your access code instead →
            </a>
          </>
        )}
      </div>
    </div>
  );
}
