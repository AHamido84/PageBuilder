"use client";

import { ScrollReveal } from "@/lib/motion/primitives";
import type { AnimationToken } from "./types";

/** Wraps children in a viewport-triggered entrance animation. No-ops for "none". Thin adapter over ScrollReveal so every block's SectionShell usage keeps the same public API. */
export function Reveal({ animation, children }: { animation: AnimationToken; children: React.ReactNode }) {
  return <ScrollReveal variant={animation}>{children}</ScrollReveal>;
}
