import type { DesignColors, ShadowPreset } from "./schema";

/**
 * What each Appearance control shows when it isn't overridden -- the values already hardcoded in
 * globals.css. Display-only: an unset field still emits no CSS at all (see resolve-css.ts).
 */
export const DEFAULT_COLORS: Required<DesignColors> = {
  primary: "#07564e",
  secondary: "#ee665a",
  accent: "#0b806f",
  gold: "#d5b45c",
  background: "#f7f8f5",
  surface: "#e6efec",
  text: "#18302d",
  mutedText: "#74827f", // approximately ink at 60% on the default background
  border: "#e0e3df", // approximately ink at 10% on the default background
};

export const DEFAULT_LAYOUT = {
  containerWidth: 1400,
  sectionSpacingScale: 1,
  gridGap: 1.25,
  cardGap: 1.5,
  buttonRadius: 0.125,
  cardRadius: 0.25,
  imageRadius: 0.25,
  sectionRadius: 0,
};

/** Single-shadow approximations of the default two-layer presets, used as the editing start point. */
export const DEFAULT_SHADOWS: Record<"soft" | "medium" | "strong", ShadowPreset> = {
  soft: { y: 1, blur: 2, spread: 0, opacity: 0.05 },
  medium: { y: 10, blur: 28, spread: -14, opacity: 0.22 },
  strong: { y: 28, blur: 56, spread: -18, opacity: 0.32 },
};
export const DEFAULT_SHADOW_COLOR = "#18302d";
