"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useDesignAnimationSettings } from "./design-animation-context";

/**
 * Phase 8 "Global Visual Control Center" -- Animation > Page Transition. A genuinely new capability
 * (no route-transition wrapper existed before this), off by default (`pageTransitionEnabled` is
 * false unless the admin turns it on) so every existing route keeps its current instant-navigation
 * behavior unless explicitly opted into. Keyed by pathname so `AnimatePresence` treats each route
 * as a distinct element to cross-fade between, not a re-render of the same one.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { pageTransitionEnabled } = useDesignAnimationSettings();
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (!pageTransitionEnabled || reduce) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
