"use client";

import { createContext, useContext } from "react";
import type { AnimationDefaultOption } from "@/lib/design-tokens/schema";

/**
 * Phase 8 "Global Visual Control Center" -- animation settings that can't be expressed as pure CSS
 * (Framer-Motion-driven behavior: viewport-triggered reveals, duration speed, route transitions).
 * The master "Animation Enabled" switch does NOT live here -- it's wired through
 * `<MotionConfig reducedMotion="always">` in the locale layout, which framer-motion's own
 * `useReducedMotion()` (already called by every primitive in motion/primitives.tsx) automatically
 * respects with zero code changes to those primitives. This context only carries the more specific
 * sub-toggles that need their own logic: Scroll Reveal, Animation Speed, Page Transition, and what
 * a section's Animation="Inherit from global default" resolves to.
 */
export interface DesignAnimationSettings {
  scrollRevealEnabled: boolean;
  speed: number;
  pageTransitionEnabled: boolean;
  defaultAnimation: AnimationDefaultOption;
}

const DEFAULT_SETTINGS: DesignAnimationSettings = {
  scrollRevealEnabled: true,
  speed: 1,
  pageTransitionEnabled: false,
  defaultAnimation: "fade-up",
};

const DesignAnimationContext = createContext<DesignAnimationSettings>(DEFAULT_SETTINGS);

export function DesignAnimationProvider({ value, children }: { value: DesignAnimationSettings; children: React.ReactNode }) {
  return <DesignAnimationContext.Provider value={value}>{children}</DesignAnimationContext.Provider>;
}

/** Defaults to today's existing behavior (reveal on, 1x speed, no page transition) for any tree
 * that renders without a provider -- e.g. the admin Page Builder canvas, which intentionally
 * previews content at neutral settings rather than the live site's customized ones. */
export function useDesignAnimationSettings(): DesignAnimationSettings {
  return useContext(DesignAnimationContext);
}
