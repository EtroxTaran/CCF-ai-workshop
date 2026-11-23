/**
 * Clean vector mini-diagrams visualizing the 3 Workshop Stages (Chaos -> Harness -> Markdown-RAG Vault).
 */
export function StageMiniDiagram({ variant }: { variant: "chaos" | "harness" | "vault" }) {
  if (variant === "chaos") {
    return (
      <svg viewBox="0 0 220 64" className="h-14 w-full" fill="none" aria-hidden="true">
        <rect x="10" y="14" width="34" height="24" rx="5" className="fill-rose-500/15 stroke-rose-500/60" strokeWidth="1.2" transform="rotate(-7 27 26)" />
        <rect x="58" y="28" width="34" height="24" rx="5" className="fill-muted stroke-border" strokeWidth="1.2" transform="rotate(9 75 40)" />
        <rect x="102" y="10" width="34" height="24" rx="5" className="fill-muted stroke-border" strokeWidth="1.2" transform="rotate(-4 119 22)" />
        <rect x="148" y="24" width="34" height="24" rx="5" className="fill-rose-500/15 stroke-rose-500/60" strokeWidth="1.2" transform="rotate(6 165 36)" />
        <path d="M44 26 C55 18, 60 44, 72 34 M92 34 C99 20, 102 22, 114 22 M136 22 C142 36, 146 38, 152 34" stroke="currentColor" strokeOpacity="0.28" strokeDasharray="3 3" strokeWidth="1.2" />
        <circle cx="198" cy="24" r="10" className="fill-rose-500/20 stroke-rose-500" strokeWidth="1.3" />
        <text x="198" y="28" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-rose-500">?</text>
      </svg>
    );
  }

  if (variant === "harness") {
    return (
      <svg viewBox="0 0 220 64" className="h-14 w-full" fill="none" aria-hidden="true">
        <rect x="12" y="14" width="44" height="36" rx="6" className="fill-muted stroke-border" strokeWidth="1.2" />
        <line x1="20" y1="24" x2="48" y2="24" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="32" x2="44" y2="32" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="40" x2="38" y2="40" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
        <path d="M58 32 H84" className="stroke-amber-500" strokeWidth="1.8" strokeDasharray="3 3" />
        <path d="M110 10 L132 18 V32 C132 45 122 52 110 56 C98 52 88 45 88 32 V18 Z" className="fill-amber-500/15 stroke-amber-500" strokeWidth="1.5" />
        <path d="M102 32 L108 38 L119 26" className="stroke-amber-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M134 32 H158" className="stroke-emerald-500" strokeWidth="1.8" />
        <rect x="160" y="16" width="48" height="32" rx="7" className="fill-emerald-500/15 stroke-emerald-500/60" strokeWidth="1.3" />
        <circle cx="173" cy="32" r="4" className="fill-emerald-500" />
        <line x1="182" y1="29" x2="200" y2="29" className="stroke-emerald-500" strokeWidth="2" strokeLinecap="round" />
        <line x1="182" y1="36" x2="195" y2="36" className="stroke-emerald-500/60" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 220 64" className="h-14 w-full" fill="none" aria-hidden="true">
      <line x1="110" y1="32" x2="38" y2="18" stroke="#A9C23F" strokeOpacity="0.55" strokeWidth="1.4" />
      <line x1="110" y1="32" x2="44" y2="48" stroke="#A9C23F" strokeOpacity="0.55" strokeWidth="1.4" />
      <line x1="110" y1="32" x2="176" y2="16" stroke="#A9C23F" strokeOpacity="0.65" strokeWidth="1.6" />
      <line x1="110" y1="32" x2="182" y2="46" stroke="#34D399" strokeOpacity="0.65" strokeWidth="1.6" />
      <line x1="176" y1="16" x2="182" y2="46" stroke="#A9C23F" strokeOpacity="0.4" strokeWidth="1.2" />
      <circle cx="38" cy="18" r="6" fill="#CBD5C0" fillOpacity="0.85" />
      <circle cx="44" cy="48" r="5" fill="#CBD5C0" fillOpacity="0.7" />
      <circle cx="176" cy="16" r="6.5" fill="#34D399" />
      <circle cx="182" cy="46" r="6.5" fill="#A9C23F" />
      <circle cx="110" cy="32" r="14" fill="#A9C23F" fillOpacity="0.2" />
      <circle cx="110" cy="32" r="9" fill="#A9C23F" />
      <text x="110" y="35" textAnchor="middle" fontSize="8" fontWeight="800" fill="#0B0F0A">MOC</text>
    </svg>
  );
}
