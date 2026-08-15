/**
 * A small thermometer glyph — the site's cold-chain visual motif, used to accent Quality/
 * Food Safety and logistics-journey moments. Purely decorative (aria-hidden). Static server-safe
 * markup; no client state, so it can render inside Server Components without a "use client" split.
 */
export function TemperatureIndicator({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 24 60" className="h-full w-auto overflow-visible stroke-current" fill="none" strokeWidth={1.25}>
        <rect x="9" y="2" width="6" height="38" rx="3" />
        <circle cx="12" cy="48" r="8" />
        <line x1="12" y1="10" x2="12" y2="40" strokeLinecap="round" className="stroke-wheat" strokeWidth={2.5} />
      </svg>
      {label ? <span className="manifest-strip mt-1 block opacity-50">{label}</span> : null}
    </div>
  );
}
