import { Sidebar } from "@/components/doctor/Sidebar";
import { ReloadDemoDataButton } from "@/components/settings/ReloadDemoDataButton";
import { RealPracticePanel } from "@/components/settings/RealPracticePanel";
import { CountrySelector } from "@/components/settings/CountrySelector";
import { signOut } from "@/lib/actions";
import { listRealPractices } from "@/lib/patientEnrollment";
import { getCurrentClinician } from "@/lib/queries";
import { DEFAULT_COUNTRY, isCountryCode } from "@/lib/emergency";

export default async function SettingsPage() {
  const [realPractices, clinician] = await Promise.all([listRealPractices(), getCurrentClinician()]);
  const country = clinician.practices?.country;
  const practiceCountry = country && isCountryCode(country) ? country : DEFAULT_COUNTRY;

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <Sidebar clinicianName={clinician.name} />
      <div className="pt-24 lg:pt-10 lg:pl-[124px]">
        <div className="px-4 sm:px-6 lg:px-8 pb-5 sm:pb-8 lg:pb-10 max-w-2xl">
          <div className="font-heading font-extrabold text-xl sm:text-2xl mb-1">Settings</div>
          <div className="text-sm text-muted mb-6 sm:mb-8">Demo utilities for rehearsing the pitch.</div>

          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 mb-5">
            <CountrySelector country={practiceCountry} />
          </div>

          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 mb-5">
            <div className="font-heading font-bold text-[15px] mb-1.5">Demo data</div>
            <div className="text-[13px] text-muted mb-4 leading-relaxed">
              Resets the demo practice to a clean state: 10 patients across HF, COPD, AMI, and pneumonia, medications, red flags, a full check-in
              history with call transcripts, alerts (some already reviewed, some not), and TCM/RPM billing status.
              Use this before a run-through if alerts have been marked reviewed during rehearsal.
            </div>
            <ReloadDemoDataButton />
          </div>

          <RealPracticePanel practices={realPractices} />

          <form action={signOut}>
            <button type="submit" className="text-[13px] font-semibold text-muted hover:text-foreground">
              Log out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
