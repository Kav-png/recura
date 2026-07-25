export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="32"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray="187.7 13.4"
        transform="rotate(-102 50 50)"
      />
      <circle cx="50" cy="18" r="7" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`bg-primary flex items-center justify-center text-white ${className ?? ""}`}>
      <LogoMark className="w-[55%] h-[55%]" />
    </div>
  );
}
