import { cn } from "@/lib/cn";
import type { SectionSettings } from "./types";
import { resolveSectionClasses } from "./style-tokens";
import { Reveal } from "./reveal";

/**
 * Shared wrapper applying a section's responsive style settings + entrance animation.
 * Used by BOTH the public SectionRenderer and the admin canvas, so a section looks
 * identical in both places by construction.
 */
export function SectionShell({
  settings,
  className,
  bleed = false,
  children,
}: {
  settings: SectionSettings;
  className?: string;
  /** True for a block instance that owns its own edge-to-edge composition (e.g. a full-bleed
   * cinematic Hero background) -- see BlockDefinition.bleedsWhen. Skips the shared max-width/
   * padding/background/top-border chrome and the viewport Reveal wrapper (a bleed block is always
   * meant to render exactly what it renders, immediately, not wait to scroll into view). The
   * section's own padding/background/breakpoint-visibility Style-panel controls have no effect
   * while bleed is true -- the block is expected to fully own its own sizing instead. */
  bleed?: boolean;
  children: React.ReactNode;
}) {
  if (bleed) return <div className={className}>{children}</div>;
  return (
    <div className={cn("border-t border-ink/10", resolveSectionClasses(settings), className)}>
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <Reveal animation={settings.animation}>{children}</Reveal>
      </div>
    </div>
  );
}
