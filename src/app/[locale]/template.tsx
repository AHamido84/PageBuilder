"use client";

import { motion, useReducedMotion } from "framer-motion";
import { DURATION, EASE_PREMIUM } from "@/lib/motion/motionTokens";

/**
 * A `template.tsx` re-mounts on every navigation within this segment (unlike `layout.tsx`, which
 * persists), giving each page a subtle fade-in on entry. Deliberately just a fade -- no loading
 * splash, no scroll-jacking, no exit animation (which would need AnimatePresence higher up and
 * risks fighting Next's own scroll-restoration) -- navigation stays instant, this only smooths
 * the paint.
 */
export default function LocaleTemplate({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: DURATION.standard, ease: EASE_PREMIUM }}>
      {children}
    </motion.div>
  );
}
