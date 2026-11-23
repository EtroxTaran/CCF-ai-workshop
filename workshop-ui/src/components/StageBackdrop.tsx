/**
 * Subtle geometric wireframe globe / constellation motif echoing Slide 1 of the virtual7 Master 2026 deck.
 */
export function StageBackdrop({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 560 560"
      fill="none"
      className={`pointer-events-none select-none ${className}`}
    >
      <defs>
        <radialGradient id="v7-globe-fade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A9C23F" stopOpacity="0.24" />
          <stop offset="70%" stopColor="#A9C23F" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#A9C23F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="280" cy="280" r="240" fill="url(#v7-globe-fade)" />
      <g stroke="#A9C23F" strokeOpacity="0.22" strokeWidth="1">
        <circle cx="280" cy="280" r="210" />
        <circle cx="280" cy="280" r="158" strokeDasharray="4 6" />
        <ellipse cx="280" cy="280" rx="210" ry="78" />
        <ellipse cx="280" cy="280" rx="210" ry="78" transform="rotate(38 280 280)" />
        <ellipse cx="280" cy="280" rx="210" ry="78" transform="rotate(-38 280 280)" />
        <ellipse cx="280" cy="280" rx="84" ry="210" />
        <path d="M128 166 L262 128 L392 178 L442 292 L352 418 L188 410 L118 282 Z" strokeOpacity="0.32" />
        <path d="M262 128 L280 280 L392 178 M128 166 L280 280 L188 410 M442 292 L280 280 L352 418" strokeOpacity="0.25" />
      </g>
      <g fill="#A9C23F" fillOpacity="0.55">
        <circle cx="280" cy="280" r="4.5" />
        <circle cx="262" cy="128" r="3.5" />
        <circle cx="392" cy="178" r="3" />
        <circle cx="442" cy="292" r="3.5" />
        <circle cx="352" cy="418" r="3" />
        <circle cx="188" cy="410" r="3.5" />
        <circle cx="118" cy="282" r="3" />
        <circle cx="128" cy="166" r="3.5" />
      </g>
    </svg>
  );
}
