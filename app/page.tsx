import Link from "next/link";
import {
  Stethoscope,
  LineChart,
  Smartphone,
  Settings as SettingsIcon,
  ArrowUpRight,
  PhoneCall,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Logo className="w-9 h-9 rounded-[9px]" />
          <span className="font-heading font-extrabold text-lg">Recura</span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">Discharge Safety Net</h1>
        <p className="text-sm sm:text-[15px] text-muted max-w-xl mb-8 sm:mb-10">
          Pick a surface to open. Each one is scoped to what that person needs to see.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 auto-rows-[minmax(0,1fr)]">
          <BentoCard
            href="/doctor"
            icon={Stethoscope}
            title="Doctor Dashboard"
            description="Patient panel, check-in transcripts, red flags, and alerts that need clinician review."
            className="sm:col-span-2 lg:col-span-2 lg:row-span-2"
            large
          >
            <div className="flex flex-wrap gap-2 mt-4">
              <Pill icon={AlertTriangle}>Alerts &amp; red flags</Pill>
              <Pill icon={PhoneCall}>Check-in transcripts</Pill>
            </div>
          </BentoCard>

          <BentoCard
            href="/practice"
            icon={LineChart}
            title="Practice ROI"
            description="Money saved and captured billing, aggregated across the whole practice."
            className="lg:col-span-1"
          >
            <div className="flex flex-wrap gap-2 mt-4">
              <Pill icon={Receipt}>TCM / RPM billing</Pill>
            </div>
          </BentoCard>

          <BentoCard
            href="/patient"
            icon={Smartphone}
            title="Patient Portal"
            description="A patient's plain-English recovery plan and their daily check-in."
            className="lg:col-span-1"
          />

          <BentoCard
            href="/settings"
            icon={SettingsIcon}
            title="Settings"
            description="Practice region, emergency number, and demo data controls."
            className="lg:col-span-1"
          />
        </div>
      </div>
    </div>
  );
}

function BentoCard({
  href,
  icon: Icon,
  title,
  description,
  className,
  large,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  className?: string;
  large?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group bg-surface rounded-2xl border border-border p-5 sm:p-6 flex flex-col justify-between hover:border-primary/40 hover:-translate-y-0.5 transition-all ${className ?? ""}`}
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className={`font-heading font-bold ${large ? "text-xl sm:text-2xl" : "text-[15px]"} mb-1.5`}>{title}</div>
        <div className={`text-muted leading-relaxed ${large ? "text-sm sm:text-[15px]" : "text-[13px]"}`}>{description}</div>
        {children}
      </div>
    </Link>
  );
}

function Pill({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-muted bg-muted-bg border border-border rounded-full px-2.5 py-1">
      <Icon className="w-3 h-3" />
      {children}
    </div>
  );
}
