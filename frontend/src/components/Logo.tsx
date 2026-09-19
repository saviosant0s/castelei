export function CastleMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect width="100" height="100" rx="22" fill="#5BABF0" />
      <g fill="#1C1C2E">
        <rect x="12" y="36" width="20" height="48" />
        <rect x="68" y="36" width="20" height="48" />
        <rect x="30" y="48" width="40" height="36" />
        <rect x="12" y="28" width="5" height="8" />
        <rect x="20" y="28" width="4" height="8" />
        <rect x="27" y="28" width="5" height="8" />
        <rect x="68" y="28" width="5" height="8" />
        <rect x="76" y="28" width="4" height="8" />
        <rect x="83" y="28" width="5" height="8" />
        <rect x="30" y="40" width="9" height="8" />
        <rect x="45.5" y="40" width="9" height="8" />
        <rect x="61" y="40" width="9" height="8" />
        <rect x="6" y="84" width="88" height="4" />
      </g>
      <path d="M43 84V66a7 7 0 0 1 14 0v18z" fill="#5BABF0" />
      <path d="M50 22v18" stroke="#1C1C2E" strokeWidth="1.5" />
      <path d="M50 22l14 5-14 5z" fill="#F4845F" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <CastleMark />
      <span className="font-display text-2xl font-bold tracking-tight">Castelei</span>
    </span>
  );
}
