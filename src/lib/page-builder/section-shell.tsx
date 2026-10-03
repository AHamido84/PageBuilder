import { cn } from "@/lib/cn";
import { sanitizeAdvancedToken } from "./types";
import type { SectionSettings } from "./types";
import {
  BORDER_RADIUS_CLASSES,
  CONTAINER_WIDTH_CLASSES,
  SHADOW_CLASSES,
  resolveBackgroundFilter,
  resolveBackgroundImageStyle,
  resolveBorderClasses,
  resolveBorderStyle,
  resolveButtonsIconClass,
  resolveButtonsStyle,
  resolveGapStyle,
  resolveOverlayStyle,
  resolveSectionClasses,
  resolveTypographyClasses,
} from "./style-tokens";
import { Reveal } from "./reveal";
import { EASING } from "@/lib/motion/motionTokens";

/** PHASE 9: data attributes that switch on the CSS-only element motion + hover effects in
 * globals.css ("Section motion system"). Only non-default values are emitted, so an unedited
 * section's DOM is exactly what it was before. */
function motionAttributes(settings: SectionSettings): { attrs: Record<string, string>; style: React.CSSProperties } {
  const attrs: Record<string, string> = {};
  const el = settings.elementMotion;
  if (el) {
    if (el.heading !== "none") attrs["data-motion-heading"] = el.heading;
    if (el.text !== "none") attrs["data-motion-text"] = el.text;
    if (el.image !== "none") attrs["data-motion-image"] = el.image;
    if (el.button !== "none") attrs["data-motion-button"] = el.button;
    if (el.card !== "none") attrs["data-motion-card"] = el.card;
  }
  const hover = settings.hover;
  if (hover) {
    if (hover.imageZoom) attrs["data-hover-img-zoom"] = "";
    if (hover.cardLift) attrs["data-hover-card-lift"] = "";
    if (hover.button !== "none") attrs["data-hover-btn"] = hover.button;
    if (hover.overlayReveal) attrs["data-hover-overlay"] = "";
  }
  const hasElementMotion = Object.keys(attrs).some((k) => k.startsWith("data-motion-"));
  const easing = EASING[settings.animationEasing] ?? EASING.premium;
  const style: React.CSSProperties = hasElementMotion && settings.animationEasing !== "premium" ? ({ "--section-motion-ease": easing.css } as React.CSSProperties) : {};
  return { attrs, style };
}

const BG_MOTION_CLASSES = { none: "", "slow-zoom": "bg-motion-slow-zoom", "ken-burns": "bg-motion-ken-burns" } as const;

/**
 * Shared wrapper applying a section's responsive style settings + entrance animation.
 * Used by BOTH the public SectionRenderer and the admin canvas, so a section looks
 * identical in both places by construction.
 *
 * Phase 2 note: `settings.containerWidth`/`borderRadius`/`height` (the design system's generic
 * "Container Width"/"Border Radius"/"Height" section settings) are resolved entirely inside this
 * function and apply to every block type for free -- they're deliberately independent of the
 * `bleed` prop below, which remains the older, heavier "this specific block instance owns an
 * edge-to-edge composition, skip section chrome entirely" escape hatch. A bleeding block ignores
 * containerWidth/borderRadius/height completely (it already renders unconstrained); a non-bleeding
 * block gets all three without any per-block code changes.
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
  // The video layer sits ABOVE the image layer (which still renders as its poster/fallback for
  // the moment before the video has loaded, or if it fails/is blocked) -- never replaces it.
  const hasVideo = Boolean(bg?.video?.url);
  const hasBackgroundLayer = hasBackgroundImage || hasVideo;

  // Phase 2: a rounded section needs overflow-hidden too, independent of hasBackgroundLayer --
  // otherwise the absolutely-positioned background/overlay layers above would visually poke out
  // past the rounded corners of their (radius-having) parent.
  const radiusClass = BORDER_RADIUS_CLASSES[settings.borderRadius];
  const needsClipping = hasBackgroundLayer || Boolean(radiusClass);

  // Phase 9 "Style > Shadow": a box-shadow must NOT sit on an overflow-hidden element, or its own
  // blur/spread gets clipped at the element's own edge -- invisible whenever Shadow is combined with
  // either Border Radius or a background image/video (a very common combo: a rounded, shadowed
  // "card" section). Fixed by wrapping the ORIGINAL padded/overflow-hidden/background element (below,
  // unchanged) in one more outer element that owns Shadow/Border/Typography/Buttons/Gap and is never
  // itself clipped -- both share the same `radiusClass` so their corners align pixel-for-pixel, and
  // the outer wrapper has no padding of its own, so it's exactly the same size as its one child.
  const shadowClass = SHADOW_CLASSES[settings.shadow];
  const borderClasses = resolveBorderClasses(settings.border);
  const gapStyle = resolveGapStyle(settings.gap);
  const buttonsStyle = resolveButtonsStyle(settings.buttons);
  const buttonsIconClass = resolveButtonsIconClass(settings.buttons);
  const typographyClasses = resolveTypographyClasses(settings.typography);
  const advanced = settings.advanced;
  const customClass = advanced?.customClass ? sanitizeAdvancedToken(advanced.customClass, true) : "";
  const anchorId = advanced?.anchorId ? sanitizeAdvancedToken(advanced.anchorId, false) : undefined;

  const outerStyle: React.CSSProperties = { ...gapStyle, ...buttonsStyle, ...resolveBorderStyle(settings.border) };
  const motion = motionAttributes(settings);
  const bgMotionClass = BG_MOTION_CLASSES[bg?.motion ?? "none"] ?? "";
  const hasOuterStyle = Object.keys(outerStyle).length > 0;

  const section = (
    // `section-radius-default` is inert unless the Appearance page sets a global Section radius
    // (resolve-css.ts emits its rule only then); a section's own Border Radius always wins.
    <div
      className={cn("border-t border-line", resolveSectionClasses(settings), radiusClass || "section-radius-default", needsClipping && "relative overflow-hidden")}
      style={Object.keys(motion.style).length ? motion.style : undefined}
      {...motion.attrs}
    >
      {hasBackgroundLayer ? (
        <>
          {hasDistinctMobileImage && hasDesktopImage ? (
            <>
              <div aria-hidden className={cn("pointer-events-none absolute inset-0 z-0 hidden md:block", bgMotionClass)} style={desktopBgStyle ?? undefined} />
              <div aria-hidden className="pointer-events-none absolute inset-0 z-0 md:hidden" style={mobileBgStyle ?? undefined} />
            </>
          ) : hasBackgroundImage ? (
            <div aria-hidden className={cn("pointer-events-none absolute inset-0 z-0", bgMotionClass)} style={(desktopBgStyle ?? mobileBgStyle) ?? undefined} />
          ) : null}
          {hasVideo && bg ? (
            <video
              aria-hidden
              autoPlay
              muted
              loop
              playsInline
              poster={bg.image?.url}
              src={bg.video!.url}
              className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
              style={{ filter: resolveBackgroundFilter(bg) || undefined, objectPosition: `${bg.positionX}% ${bg.positionY}%` }}
            />
          ) : null}
          {overlayStyle ? <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]" style={overlayStyle} /> : null}
        </>
      ) : null}
      <div className={cn(CONTAINER_WIDTH_CLASSES[settings.containerWidth], hasBackgroundLayer && "relative z-[2]")}>
        <Reveal
          animation={settings.animation}
          durationMs={settings.animationDurationMs}
          delayMs={settings.animationDelayMs}
          trigger={settings.animationTrigger}
          intensity={settings.animationIntensity}
          easing={settings.animationEasing}
        >
          {children}
        </Reveal>
      </div>
    </div>
  );

  // Skip the extra wrapper entirely when nothing Phase 9-specific is actually set -- an unedited
  // section renders the exact same single-`<div>` DOM as before this phase (zero-visual-change
  // default; `className` is currently unused by both callers, SectionRenderer and the admin canvas).
  const needsOuterWrapper = Boolean(shadowClass || borderClasses || typographyClasses || buttonsIconClass || hasOuterStyle || anchorId || customClass);
  if (!needsOuterWrapper) return className ? <div className={className}>{section}</div> : section;

  return (
    <div
      id={anchorId || undefined}
      style={hasOuterStyle ? outerStyle : undefined}
      className={cn(radiusClass, borderClasses, shadowClass, typographyClasses, buttonsIconClass, className, customClass)}
    >
      {section}
    </div>
  );
}
