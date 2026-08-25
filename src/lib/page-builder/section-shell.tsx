import { cn } from "@/lib/cn";
import type { SectionSettings } from "./types";
import { resolveBackgroundImageStyle, resolveOverlayStyle, resolveSectionClasses } from "./style-tokens";
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

  // Optional background-image/overlay layer (FIX §16-21). Stacking is explicit, not relied on
  // DOM-order/z-index:auto defaults: background z-0, overlay z-[1], content z-[2] -- all three
  // only get position/z-index applied when an image is actually configured, so sections with no
  // background image are completely unaffected (no new stacking context, no overflow clipping).
  const bg = settings.backgroundImage;
  const hasDesktopImage = Boolean(bg?.image?.url);
  const hasDistinctMobileImage = Boolean(bg?.mobileImage?.url);
  const desktopBgStyle = bg ? resolveBackgroundImageStyle(bg, "desktop") : null;
  const mobileBgStyle = bg ? resolveBackgroundImageStyle(bg, "mobile") : null;
  const overlayStyle = bg ? resolveOverlayStyle(bg) : null;
  const hasBackgroundImage = Boolean(desktopBgStyle || mobileBgStyle);

  return (
    <div className={cn("border-t border-ink/10", resolveSectionClasses(settings), hasBackgroundImage && "relative overflow-hidden", className)}>
      {hasBackgroundImage ? (
        <>
          {hasDistinctMobileImage && hasDesktopImage ? (
            <>
              <div aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden md:block" style={desktopBgStyle ?? undefined} />
              <div aria-hidden className="pointer-events-none absolute inset-0 z-0 md:hidden" style={mobileBgStyle ?? undefined} />
            </>
          ) : (
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={(desktopBgStyle ?? mobileBgStyle) ?? undefined} />
          )}
          {overlayStyle ? <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]" style={overlayStyle} /> : null}
        </>
      ) : null}
      <div className={cn("mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12", hasBackgroundImage && "relative z-[2]")}>
        <Reveal animation={settings.animation}>{children}</Reveal>
      </div>
    </div>
  );
}
