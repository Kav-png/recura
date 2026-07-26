"use client";

import Link from "next/link";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden text-[13px] font-semibold px-4 py-2 rounded-lg bg-primary text-white"
    >
      Print / save as PDF
    </button>
  );
}

export function BackButton({ href }: { href: string }) {
  return (
    <Link href={href} className="print:hidden text-[13px] font-semibold text-primary hover:underline">
      ← Back
    </Link>
  );
}
