import { cookies } from "next/headers";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PATIENT_SESSION_COOKIE, verifyPatientSessionCookie } from "@/lib/auth";

// Consumer-simple shell, intentionally not the doctor dashboard's dark sidebar layout —
// single column, generous spacing, works standalone on a phone. Two ways in here (proxy.ts):
// the shared staff/demo code (picker + any patient — "Switch patient" makes sense) or a real
// patient's own individual access_code (locked to one patient — showing a link that implies you
// can see other patients would be actively wrong, not just unnecessary).
export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const isScopedToOnePatient = !!verifyPatientSessionCookie((await cookies()).get(PATIENT_SESSION_COOKIE)?.value);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur border-b border-border/60">
        <div className="max-w-xl sm:max-w-2xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <Logo className="w-8 h-8 rounded-lg shrink-0" />
          <div className="font-heading font-bold text-[15px]">Your Recovery</div>
          {!isScopedToOnePatient && (
            <Link href="/patient" className="ml-auto text-[12.5px] text-muted hover:text-foreground transition-colors">
              Switch patient
            </Link>
          )}
        </div>
      </header>
      <main className="max-w-xl sm:max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">{children}</main>
    </div>
  );
}
