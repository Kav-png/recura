"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, InstitutionIcon, SettingsGearIcon } from "@/components/doctor/SidebarIcons";
import { Logo } from "@/components/Logo";

const navItems = [
  { label: "Doctor dashboard", href: "/doctor", icon: DashboardIcon, match: "/doctor" },
  { label: "Practice overview", href: "/practice", icon: InstitutionIcon, match: "/practice" },
  { label: "Settings", href: "/settings", icon: SettingsGearIcon, match: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed z-40 top-3 left-3 right-3 lg:right-auto lg:top-4 lg:left-4 lg:w-[88px] bg-sidebar rounded-3xl shadow-lg shadow-black/10 flex flex-row lg:flex-col items-center justify-between lg:justify-start px-4 lg:px-0 py-2.5 lg:py-7 gap-0 lg:gap-8">
      <Logo className="w-9 h-9 lg:w-10 lg:h-10 rounded-[10px] lg:rounded-[11px] shrink-0" />
      <nav className="flex flex-row lg:flex-col gap-1 lg:gap-1.5 lg:w-full items-center">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.match);
          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              className={`w-11 h-11 lg:w-14 lg:h-12 rounded-xl flex items-center justify-center lg:mb-1 transition-colors ${
                active ? "bg-primary text-white" : "text-white/50 hover:bg-white/10"
              }`}
            >
              <item.icon size={20} strokeWidth={2} />
            </Link>
          );
        })}
      </nav>
      <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/20 border-2 border-primary shrink-0 lg:mt-2" />
    </div>
  );
}
