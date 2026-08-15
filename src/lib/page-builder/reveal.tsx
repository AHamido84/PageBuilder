"use client";

import { Parallax, ScrollReveal } from "@/lib/motion/primitives";
import type { AnimationToken } from "./types";

/**
 * Wraps children in a section's chosen entrance animation. No-ops for "none". Thin adapter over
 * the motion primitives so every block's SectionShell usage keeps the same public API.
 * "parallax" is continuous/scroll-linked rather than a one-shot viewport trigger, so it routes to
 * the Parallax primitive instead of ScrollReveal's discrete variant set.
 */
export function Reveal({ animation, children }: { animation: AnimationToken; children: React.ReactNode }) {
  if (animation === "parallax") return <Parallax>{children}</Parallax>;
  return <ScrollReveal variant={animation}>{children}</ScrollReveal>;
}
