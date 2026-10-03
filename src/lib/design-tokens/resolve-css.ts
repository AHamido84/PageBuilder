import type { ButtonVariantColors, DesignTokens, EditableButtonVariant, ShadowPreset } from "./schema";

/**
 * Turns a (partial, all-optional) DesignTokens object into a CSS string of overrides -- ONLY for
 * fields the admin actually set. An empty `DesignTokens` resolves to an empty string, so the page
 * renders with zero extra CSS, exactly as before this system existed. Global settings act as pure
 * DEFAULTS: every per-section Style-panel setting (more specific in the cascade, or applied via its
 * own inline style) keeps winning over these values.
 *
 * Variables are declared on `html:root` (specificity 0,1,1) rather than plain `:root` so they win
 * over globals.css's `:root` defaults regardless of stylesheet order in <head>.
 *
 * Color companion shades (hover/soft variants) are derived from the single admin-chosen base
 * color via color-mix() rather than asking for 3 shades per color.
 *
 * Pure and dependency-free: also runs in the browser, where the Appearance page uses it to build
 * the live-preview CSS from unsaved form state (`scope` lets that preview target any selector).
 */
export function buildDesignTokensCss(tokens: DesignTokens, scope = "html:root"): string {
  const rootLines: string[] = [];
  const tabletLines: string[] = [];
  const mobileLines: string[] = [];
  const rules: string[] = [];

  const colors = tokens.colors;
  if (colors?.primary) {
    rootLines.push(`--color-petrol: ${colors.primary};`);
    rootLines.push(`--color-petrol-elevated: color-mix(in srgb, ${colors.primary} 88%, white);`);
    rootLines.push(`--color-petrol-soft: color-mix(in srgb, ${colors.primary} 15%, white);`);
  }
  if (colors?.secondary) {
    rootLines.push(`--color-coral: ${colors.secondary};`);
    rootLines.push(`--color-coral-strong: color-mix(in srgb, ${colors.secondary} 85%, black);`);
    rootLines.push(`--color-coral-soft: color-mix(in srgb, ${colors.secondary} 20%, white);`);
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
  if (colors?.border) {
    rootLines.push(`--color-border: ${colors.border};`);
    rootLines.push(`--color-border-strong: color-mix(in oklab, ${colors.border} 80%, var(--color-ink));`);
  }

  const typography = tokens.typography;
  if (typography?.fontEn) rootLines.push(`--font-body: var(--font-body-${typography.fontEn});`);
  if (typography?.fontAr) rootLines.push(`--font-arabic: var(--font-arabic-${typography.fontAr});`);
  if (typography?.fontHeadingEn && typography.fontHeadingEn !== "archivo") {
    rootLines.push(`--font-display: var(--font-body-${typography.fontHeadingEn});`);
    // Archivo's 133% width relies on its own width axis; other faces render at their normal width.
    rules.push(`html[dir="ltr"] .font-display { font-stretch: normal; }`);
  }
  if (typography?.fontHeadingAr) rootLines.push(`--font-display-ar: var(--font-arabic-${typography.fontHeadingAr});`);
  if (typography?.displaySize) rootLines.push(`--scale-display: ${typography.displaySize};`);
  if (typography?.h1Size) rootLines.push(`--scale-h1: ${typography.h1Size};`);
  if (typography?.h2Size) rootLines.push(`--scale-h2: ${typography.h2Size};`);
  if (typography?.h3Size) rootLines.push(`--scale-h3: ${typography.h3Size};`);
  if (typography?.bodySize) rootLines.push(`--scale-body: ${typography.bodySize};`);
  if (typography?.weightHeading) rules.push(`.font-display { font-weight: ${typography.weightHeading}; }`);
  if (typography?.weightBody) rules.push(`body { font-weight: ${typography.weightBody}; }`);
  const headingLh = typography?.lineHeightHeading ?? typography?.lineHeightScale;
  const bodyLh = typography?.lineHeightBody ?? typography?.lineHeightScale;
  if (headingLh) {
    // Each heading class's own default line-height (globals.css) times the admin's scale.
    const defaults: Record<string, number> = { display: 1.02, hero: 1.04, h1: 1.08, h2: 1.12, h3: 1.2, h4: 1.3 };
    for (const [cls, lh] of Object.entries(defaults)) rules.push(`.text-${cls} { line-height: ${round(lh * headingLh)}; }`);
  }
  if (bodyLh) rules.push(`body { line-height: ${round(1.5 * bodyLh)}; } .text-body { line-height: ${round(1.6 * bodyLh)}; }`);
  if (typography?.letterSpacingExtra) {
    rules.push(`.font-display { letter-spacing: calc(-0.01em + ${typography.letterSpacingExtra}em); }`);
  }
  if (typography?.letterSpacingBody) rules.push(`body { letter-spacing: ${typography.letterSpacingBody}em; }`);

  const layout = tokens.layout;
  if (layout?.containerWidth) rootLines.push(`--container-max: ${layout.containerWidth}px;`);
  if (layout?.sectionSpacingScale) rootLines.push(`--section-spacing-scale: ${layout.sectionSpacingScale};`);
  if (layout?.gridGap != null) rootLines.push(`--grid-gap: ${layout.gridGap}rem;`);
  if (layout?.cardGap != null) rootLines.push(`--card-gap: ${layout.cardGap}rem;`);
  if (layout?.buttonRadius != null) rootLines.push(`--button-radius: ${layout.buttonRadius}rem;`);
  if (layout?.cardRadius != null) {
    // One value for every card recipe, so the control visibly reaches product/category/solution cards too.
    for (const v of ["--card-radius", "--card-radius-lg", "--card-radius-xl"]) rootLines.push(`${v}: ${layout.cardRadius}rem;`);
  }
  if (layout?.imageRadius != null) {
    for (const v of ["--image-radius", "--image-radius-lg"]) rootLines.push(`${v}: ${layout.imageRadius}rem;`);
  }
  if (layout?.sectionRadius) {
    // Applies only to sections that don't set their own Border Radius (see SectionShell).
    // overflow: clip (not hidden) rounds background layers without creating a scroll container.
    rules.push(`.section-radius-default { border-radius: ${layout.sectionRadius}rem; overflow: clip; }`);
  }

  const shadows = tokens.shadows;
  if (shadows?.soft || shadows?.medium || shadows?.strong) {
    const rgb = hexToRgb(shadows.color ?? "#18302d");
    const shadow = (p: ShadowPreset) => `0 ${p.y}px ${p.blur}px ${p.spread}px rgba(${rgb}, ${p.opacity})`;
    if (shadows.soft) rootLines.push(`--shadow-flat: ${shadow(shadows.soft)};`);
    if (shadows.medium) rootLines.push(`--shadow-card: ${shadow(shadows.medium)};`);
    if (shadows.strong) rootLines.push(`--shadow-lifted: ${shadow(shadows.strong)};`);
  }

  const buttons = tokens.buttons;
  if (buttons?.paddingScale) rootLines.push(`--button-padding-scale: ${buttons.paddingScale};`);
  // Buttons' own radius field stays in sync with Layout's (same underlying --button-radius
  // variable) -- the Appearance page writes both, so they can't drift apart.
  if (buttons?.radius != null) rootLines.push(`--button-radius: ${buttons.radius}rem;`);
  if (buttons?.shadow) {
    const shadowVar = buttons.shadow === "none" ? "none" : `var(--shadow-${buttons.shadow})`;
    rootLines.push(`--button-shadow: ${shadowVar};`);
  }
  if (buttons?.showIcon === false) rules.push(`.btn-icon { display: none; }`);
  const VARIANT_VAR: Record<EditableButtonVariant, string> = { primary: "primary", secondary: "secondary", gold: "gold", ghostGold: "ghost-gold" };
  const FIELD_VAR: Record<keyof ButtonVariantColors, string> = { bg: "bg", text: "text", border: "border", hoverBg: "hover-bg", hoverText: "hover-text" };
  for (const variant of Object.keys(VARIANT_VAR) as EditableButtonVariant[]) {
    const colorsForVariant = buttons?.[variant];
    if (!colorsForVariant) continue;
    for (const field of Object.keys(FIELD_VAR) as (keyof ButtonVariantColors)[]) {
      const value = colorsForVariant[field];
      if (value) rootLines.push(`--btn-${VARIANT_VAR[variant]}-${FIELD_VAR[field]}: ${value};`);
    }
  }

  const animation = tokens.animation;
  if (animation?.enabled === false || animation?.hoverAnimation === false) {
    rules.push(
      `html[data-hover-animation="off"] .hover-lift:hover, html[data-hover-animation="off"] [class*="hover:-translate"]:hover, html[data-hover-animation="off"] [class*="hover:scale"]:hover { transform: none !important; box-shadow: inherit !important; }`
    );
  }

  const responsive = tokens.responsive;
  if (responsive?.tablet?.sectionSpacingScale) tabletLines.push(`--section-spacing-scale: ${responsive.tablet.sectionSpacingScale};`);
  if (responsive?.tablet?.gridGap != null) tabletLines.push(`--grid-gap: ${responsive.tablet.gridGap}rem;`);
  if (responsive?.tablet?.cardGap != null) tabletLines.push(`--card-gap: ${responsive.tablet.cardGap}rem;`);
  if (responsive?.mobile?.sectionSpacingScale) mobileLines.push(`--section-spacing-scale: ${responsive.mobile.sectionSpacingScale};`);
  if (responsive?.mobile?.gridGap != null) mobileLines.push(`--grid-gap: ${responsive.mobile.gridGap}rem;`);
  if (responsive?.mobile?.cardGap != null) mobileLines.push(`--card-gap: ${responsive.mobile.cardGap}rem;`);

  const blocks: string[] = [];
  if (rootLines.length) blocks.push(`${scope}{${rootLines.join("")}}`);
  if (rules.length) blocks.push(rules.join(""));
  // Tablet-max first, then mobile-max, so a value set on both narrows correctly at small widths.
  if (tabletLines.length) blocks.push(`@media (max-width: 1023px){${scope}{${tabletLines.join("")}}}`);
  if (mobileLines.length) blocks.push(`@media (max-width: 639px){${scope}{${mobileLines.join("")}}}`);

  return blocks.join("\n");
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function hexToRgb(hex: string): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
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
