export function RequestIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" className={className}>
      <rect x="2" y="4" width="44" height="32" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M2 6l22 16L46 6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M50 20h12M62 20l-5-5M62 20l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CompareIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" className={className}>
      <rect x="4" y="20" width="12" height="24" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="26" y="8" width="12" height="36" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="48" y="28" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M10 14v-2M32 4v-2M54 24v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ApproveIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path
        d="M24 2l5.5 3.2 6.3-0.6 2.6 5.8 5.8 2.6-0.6 6.3L46.8 24l-3.2 5.5 0.6 6.3-5.8 2.6-2.6 5.8-6.3-0.6L24 46.8l-5.5-3.2-6.3 0.6-2.6-5.8-5.8-2.6 0.6-6.3L1.2 24l3.2-5.5-0.6-6.3 5.8-2.6 2.6-5.8 6.3 0.6L24 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M16 24l6 6 12-13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
