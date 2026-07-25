"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PulseIcon, ChartIcon, SlidersIcon } from "@/components/doctor/SidebarIcons";
import { Logo } from "@/components/Logo";
import { initials } from "@/lib/status";

const navItems = [
  { label: "Doctor dashboard", href: "/doctor", icon: PulseIcon, match: "/doctor" },
  { label: "Practice overview", href: "/practice", icon: ChartIcon, match: "/practice" },
  { label: "Settings", href: "/settings", icon: SlidersIcon, match: "/settings" },
];

const spring = { type: "spring" as const, stiffness: 480, damping: 32, mass: 0.7 };

const tooltipClass =
  "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-[#1a1310] px-2.5 py-1.5 text-[11px] font-medium text-white/90 shadow-lg shadow-black/30 opacity-0 scale-95 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:scale-100 top-full left-1/2 -translate-x-1/2 mt-2.5 lg:top-1/2 lg:left-full lg:mt-0 lg:ml-3 lg:-translate-y-1/2 lg:translate-x-0";

export function Sidebar({ clinicianName }: { clinicianName?: string }) {
  const pathname = usePathname();

  return (
    <div className="fixed z-40 top-3 left-3 right-3 lg:right-auto lg:top-4 lg:left-4 lg:w-[88px] surface-dark rounded-3xl flex flex-row lg:flex-col items-center justify-between lg:justify-start px-4 lg:px-0 py-2.5 lg:py-7 gap-0 lg:gap-8">
      <motion.div
        whileHover={{ scale: 1.08, rotate: 6 }}
        whileTap={{ scale: 0.92 }}
        transition={spring}
        className="shrink-0"
      >
        <Logo className="w-9 h-9 lg:w-10 lg:h-10 rounded-[10px] lg:rounded-[11px]" />
      </motion.div>
      <nav className="flex flex-row lg:flex-col gap-1.5 lg:gap-2 lg:w-full items-center">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.match);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              className="group relative w-11 h-11 lg:w-14 lg:h-12 rounded-2xl flex items-center justify-center lg:mb-1"
            >
              <span className={tooltipClass}>{item.label}</span>
              {active ? (
                <motion.span
                  layoutId="sidebar-active-pill"
                  transition={spring}
                  className="absolute inset-0 rounded-2xl bg-primary shadow-md shadow-primary/50"
                />
              ) : (
                <span className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/[0.08] transition-colors duration-200" />
              )}
              <motion.span
                whileHover={{ scale: 1.14 }}
                whileTap={{ scale: 0.88 }}
                transition={spring}
                className={`relative z-10 flex items-center justify-center transition-colors duration-200 ${
                  active ? "text-white" : "text-white/45 group-hover:text-white/85"
                }`}
              >
                <item.icon size={19} strokeWidth={1.75} />
              </motion.span>
            </Link>
          );
        })}
      </nav>
      <div className="group relative shrink-0 lg:mt-2">
        {clinicianName ? <span className={tooltipClass}>{clinicianName}</span> : null}
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={spring}
          className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center font-heading font-bold text-white text-[11px] lg:text-xs"
        >
          {clinicianName ? initials(clinicianName) : null}
        </motion.div>
      </div>
    </div>
  );
}
