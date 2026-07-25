type IconProps = { size?: number; strokeWidth?: number; className?: string };

export function PulseIcon({ size = 24, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 13h3.4l1.8-5.5L11.4 19l2.7-11.5L15.7 13H21.5" />
    </svg>
  );
}

export function HospitalIcon({ size = 24, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 21V6.2a1 1 0 0 1 .55-.9l6.5-3.25a1 1 0 0 1 .9 0l6.5 3.25a1 1 0 0 1 .55.9V21" />
      <path d="M2.5 21h19" />
      <path d="M9.5 21v-4h5v4" />
      <path d="M12 8v5.5" />
      <path d="M9.25 10.75h5.5" />
    </svg>
  );
}

export function ChartIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="14" width="4.4" height="7" rx="1.4" />
      <rect x="10.3" y="9" width="4.4" height="12" rx="1.4" />
      <rect x="16.6" y="3.5" width="4.4" height="17.5" rx="1.4" />
    </svg>
  );
}

export function SlidersIcon({ size = 24, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 6h9" />
      <path d="M16.5 6h4" />
      <circle cx="14" cy="6" r="2" fill="currentColor" stroke="none" />
      <path d="M3.5 12h4" />
      <path d="M10.5 12h10" />
      <circle cx="8" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M3.5 18h11" />
      <path d="M18.5 18h2" />
      <circle cx="16" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
