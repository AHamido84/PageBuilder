import type { DesignTokens } from "./schema";

/**
 * Turns a (partial, all-optional) DesignTokens object into a real CSS string of `:root{...}`
 * overrides -- ONLY for fields the admin actually set. An entirely empty `DesignTokens` (the
 * default state, before anyone opens the Appearance panel) resolves to an empty string, so the
 * page renders with zero extra CSS and byte-for-byte the same visual output as before Phase 8
 * existed. This "only emit what's actually configured" rule is what keeps global settings acting
 * as pure DEFAULTS -- every existing per-section Style-panel setting (background/animation/padding/
 * etc, already more specific in the cascade or applied via its own inline style) continues to win
 * over whatever these `:root` values resolve to, exactly as it does today.
 *
 * Color "-strong"/"-soft" companion shades (hover states, soft backgrounds) are derived from the
 * single admin-provided base color via `color-mix()` rather than asking for 3 shades per color --
 * this only ever applies to a color the admin has actually customized (the base hex in globals.css
 * is untouched, so an unconfigured color's existing hardcoded companion shades are unaffected).
 */
export function buildDesignTokensCss(tokens: DesignTokens): string {
  const rootLines: string[] = [];
  const tabletLines: string[] = [];
  const mobileLines: string[] = [];
  const rules: string[] = [];

  const colors = tokens.colors;
  if (colors?.primary) {
    rootLines.push(`--color-coral: ${colors.primary};`);
    rootLines.push(`--color-coral-strong: color-mix(in srgb, ${colors.primary} 85%, black);`);
    rootLines.push(`--color-coral-soft: color-mix(in srgb, ${colors.primary} 20%, white);`);
  }
  if (colors?.secondary) {
    rootLines.push(`--color-petrol: ${colors.secondary};`);
    rootLines.push(`--color-petrol-elevated: color-mix(in srgb, ${colors.secondary} 88%, white);`);
    rootLines.push(`--color-petrol-soft: color-mix(in srgb, ${colors.secondary} 15%, white);`);
  }
  if (colors?.accent) {
    rootLines.push(`--color-harbor: ${colors.accent};`);
    rootLines.push(`--color-harbor-soft: color-mix(in srgb, ${colors.accent} 15%, white);`);
  }
  if (colors?.gold) {
    rootLines.push(`--color-wheat: ${colors.gold};`);
    rootLines.push(`--color-wheat-strong: color-mix(in srgb, ${colors.gold} 85%, black);`);
    rootLines.push(`--color-wheat-soft: color-mix(in srgb, ${colors.gold} 20%, white);`);
  }
  if (colors?.background) {
    rootLines.push(`--color-paper: ${colors.background};`);
    rootLines.push(`--color-paper-dim: color-mix(in srgb, ${colors.background} 92%, black);`);
  }
  if (colors?.surface) rootLines.push(`--color-frost: ${colors.surface};`);
  if (colors?.text) {
    rootLines.push(`--color-ink: ${colors.text};`);
    rootLines.push(`--color-ink-soft: color-mix(in srgb, ${colors.text} 88%, white);`);
  }
  if (colors?.mutedText) rootLines.push(`--color-muted-text: ${colors.mutedText};`);

  const typography = tokens.typography;
  if (typography?.fontEn) rootLines.push(`--font-body: var(--font-body-${typography.fontEn});`);
  if (typography?.fontAr) rootLines.push(`--font-arabic: var(--font-arabic-${typography.fontAr});`);
  if (typography?.displaySize) rootLines.push(`--scale-display: ${typography.displaySize};`);
  if (typography?.h1Size) rootLines.push(`--scale-h1: ${typography.h1Size};`);
  if (typography?.h2Size) rootLines.push(`--scale-h2: ${typography.h2Size};`);
  if (typography?.h3Size) rootLines.push(`--scale-h3: ${typography.h3Size};`);
  if (typography?.bodySize) rootLines.push(`--scale-body: ${typography.bodySize};`);
  if (typography?.weightHeading) rules.push(`.font-display { font-weight: ${typography.weightHeading}; }`);
  if (typography?.weightBody) rules.push(`body { font-weight: ${typography.weightBody}; }`);
  if (typography?.lineHeightScale) {
    rules.push(
      `.text-display, .text-hero, .text-h1, .text-h2, .text-h3, .text-h4, .text-body { line-height: calc(1em * ${typography.lineHeightScale}); }`
    );
  }
  if (typography?.letterSpacingExtra) {
    rules.push(`.font-display { letter-spacing: calc(-0.01em + ${typography.letterSpacingExtra}em); }`);
  }

  const layout = tokens.layout;
  if (layout?.containerWidth) rootLines.push(`--container-max: ${layout.containerWidth}px;`);
  if (layout?.sectionSpacingScale) rootLines.push(`--section-spacing-scale: ${layout.sectionSpacingScale};`);
  if (layout?.gridGap) rootLines.push(`--grid-gap: ${layout.gridGap}rem;`);
  if (layout?.cardGap) rootLines.push(`--card-gap: ${layout.cardGap}rem;`);
  if (layout?.buttonRadius != null) rootLines.push(`--button-radius: ${layout.buttonRadius}rem;`);
  if (layout?.cardRadius != null) rootLines.push(`--card-radius: ${layout.cardRadius}rem;`);
  if (layout?.imageRadius != null) rootLines.push(`--image-radius: ${layout.imageRadius}rem;`);

  const buttons = tokens.buttons;
  if (buttons?.paddingScale) rootLines.push(`--button-padding-scale: ${buttons.paddingScale};`);
  // Buttons' own radius field stays in sync with Layout's (same underlying --button-radius
  // variable) -- whichever the admin touched most recently wins, matching a single source of truth
  // instead of two variables that can silently drift out of sync.
  if (buttons?.radius != null) rootLines.push(`--button-radius: ${buttons.radius}rem;`);
  if (buttons?.shadow) {
    const shadowVar = buttons.shadow === "none" ? "none" : `var(--shadow-${buttons.shadow})`;
    rootLines.push(`--button-shadow: ${shadowVar};`);
  }
  if (buttons?.showIcon === false) rules.push(`.btn-icon { display: none; }`);

  const animation = tokens.animation;
  if (animation?.enabled === false || animation?.hoverAnimation === false) {
    rules.push(
      `html[data-hover-animation="off"] .hover-lift:hover, html[data-hover-animation="off"] [class*="hover:-translate"]:hover, html[data-hover-animation="off"] [class*="hover:scale"]:hover { transform: none !important; box-shadow: inherit !important; }`
    );
  }

  const responsive = tokens.responsive;
  if (responsive?.tablet?.sectionSpacingScale) tabletLines.push(`--section-spacing-scale: ${responsive.tablet.sectionSpacingScale};`);
  if (responsive?.tablet?.gridGap) tabletLines.push(`--grid-gap: ${responsive.tablet.gridGap}rem;`);
  if (responsive?.tablet?.cardGap) tabletLines.push(`--card-gap: ${responsive.tablet.cardGap}rem;`);
  if (responsive?.mobile?.sectionSpacingScale) mobileLines.push(`--section-spacing-scale: ${responsive.mobile.sectionSpacingScale};`);
  if (responsive?.mobile?.gridGap) mobileLines.push(`--grid-gap: ${responsive.mobile.gridGap}rem;`);
  if (responsive?.mobile?.cardGap) mobileLines.push(`--card-gap: ${responsive.mobile.cardGap}rem;`);

  const blocks: string[] = [];
  if (rootLines.length) blocks.push(`:root{${rootLines.join("")}}`);
  if (rules.length) blocks.push(rules.join(""));
  // Mobile-max first, then tablet-max, so a value set on both narrows correctly (min-width order
  // doesn't matter here since these are both max-width queries -- the more specific/narrower one
  // must come later to win at very small widths). Written as max-width so an unset breakpoint
  // simply keeps inheriting the desktop/:root value already resolved above.
  if (tabletLines.length) blocks.push(`@media (max-width: 1023px){:root{${tabletLines.join("")}}}`);
  if (mobileLines.length) blocks.push(`@media (max-width: 639px){:root{${mobileLines.join("")}}}`);

  return blocks.join("\n");
}

/** Whether Framer-Motion-driven animation should run at all -- the master switch. Defaults true
 * (today's existing behavior: animations always run, subject only to prefers-reduced-motion). */
export function isAnimationEnabled(tokens: DesignTokens): boolean {
  return tokens.animation?.enabled !== false;
}
export function isScrollRevealEnabled(tokens: DesignTokens): boolean {
  return isAnimationEnabled(tokens) && tokens.animation?.scrollReveal !== false;
}
export function isPageTransitionEnabled(tokens: DesignTokens): boolean {
  return isAnimationEnabled(tokens) && tokens.animation?.pageTransition === true;
}
export function resolveAnimationSpeed(tokens: DesignTokens): number {
  return tokens.animation?.speed ?? 1;
}
export function resolveDefaultAnimation(tokens: DesignTokens): string {
  return tokens.animation?.defaultAnimation ?? "fade-up";
}
