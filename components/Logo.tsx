export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <path
        d="M 61.21 24.77 A 26.4 26.4 0 1 1 34.81 31.97"
        stroke="currentColor"
        strokeWidth="13.2"
        strokeLinecap="round"
      />
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
