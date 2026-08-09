"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationToken } from "./types";

const INITIAL_CLASSES: Record<AnimationToken, string> = {
  none: "",
  "fade-up": "opacity-0 translate-y-6",
  "fade-in": "opacity-0",
  "zoom-in": "opacity-0 scale-95",
};

const REVEALED_CLASSES: Record<AnimationToken, string> = {
  none: "",
  "fade-up": "opacity-100 translate-y-0",
  "fade-in": "opacity-100",
  "zoom-in": "opacity-100 scale-100",
};

/** Wraps children in an IntersectionObserver-triggered entrance animation. No-ops for "none". */
export function Reveal({ animation, children }: { animation: AnimationToken; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(animation === "none");

  useEffect(() => {
    if (animation === "none") return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animation]);

  if (animation === "none") return <>{children}</>;

  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? REVEALED_CLASSES[animation] : INITIAL_CLASSES[animation]}`}>
      {children}
    </div>
  );
}
