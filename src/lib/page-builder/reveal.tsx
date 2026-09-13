"use client";

import { Parallax, ScrollReveal } from "@/lib/motion/primitives";
import { useDesignAnimationSettings } from "@/components/site/design-animation-context";
import type { AnimationIntensityToken, AnimationTriggerToken, AnimationToken } from "./types";

// Phase 9 "Animation > Intensity" applied to Parallax's total travel distance (its own "offset"
// prop, default 36px) -- same INTENSITY_SCALE multiplier convention as ScrollReveal's variants.
const PARALLAX_OFFSET: Record<AnimationIntensityToken, number> = { subtle: 18, normal: 36, strong: 60 };

/**
 * Wraps children in a section's chosen entrance animation. No-ops for "none". Thin adapter over
 * the motion primitives so every block's SectionShell usage keeps the same public API.
 * "parallax" is continuous/scroll-linked rather than a one-shot viewport trigger, so it routes to
 * the Parallax primitive instead of ScrollReveal's discrete variant set (Duration/Delay/Trigger
 * don't apply to it -- it's not a one-shot transition -- only Intensity does, via its offset prop).
 * "inherit" (Phase 8) resolves to the site-wide Animation > Default Animation setting at render time.
 * Phase 9's durationMs/delayMs/trigger/intensity are all optional and default to the exact prior
 * hardcoded behavior when unset (see ScrollReveal's own defaults).
 */
export function Reveal({
  animation,
  children,
  durationMs,
  delayMs,
  trigger,
  intensity = "normal",
}: {
  animation: AnimationToken;
  children: React.ReactNode;
  durationMs?: number | null;
  delayMs?: number;
  trigger?: AnimationTriggerToken;
  intensity?: AnimationIntensityToken;
}) {
  const { defaultAnimation } = useDesignAnimationSettings();
  const resolved = animation === "inherit" ? defaultAnimation : animation;
  if (resolved === "parallax") return <Parallax offset={PARALLAX_OFFSET[intensity]}>{children}</Parallax>;
  return (
    <ScrollReveal
      variant={resolved}
      durationSec={durationMs != null ? durationMs / 1000 : undefined}
      delaySec={delayMs != null ? delayMs / 1000 : undefined}
      trigger={trigger}
      intensity={intensity}
    >
      {children}
    </ScrollReveal>
  );
}
