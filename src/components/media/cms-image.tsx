"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Diagnostic context attached to a dev-only console warning when a CMS-sourced image fails to
 * load (broken URL, deleted blob, revoked remote host, ...) -- deliberately NOT logged in
 * production (would just be noise for site visitors' consoles), but present in dev so whoever is
 * editing content can actually find which section/media reference is broken instead of guessing.
 */
export interface MediaErrorContext {
  mediaId?: string;
  component?: string;
  sectionId?: string;
  locale?: string;
}

function logMediaError(url: string | undefined, context?: MediaErrorContext) {
  if (process.env.NODE_ENV === "production") return;
  console.warn("[cms-image] failed to load", { url, ...context });
}

/**
 * Plain <img>-based fallback wrapper -- a drop-in replacement for the many Page Builder blocks
 * that render `<img src className />` directly (arbitrary aspect ratios via CSS classes, no sized
 * parent for next/image's `fill` mode). On a genuine load failure -- NOT "no image selected",
 * callers already skip rendering this when there's nothing to show -- swaps to a placeholder that
 * keeps the exact same box (same className, so layout never shifts or collapses) instead of a
 * browser's default broken-image icon or a blank gap, and logs a dev-only diagnostic.
 */
export function CmsImage({
  src,
  alt,
  className,
  style,
  /** Extra classes applied ONLY to the failure placeholder, e.g. a min-height -- needed because
   * many callers rely on the real `<img>`'s intrinsic aspect ratio for sizing (no explicit height
   * in `className`), which a heightless empty `<div>` fallback can't reproduce; without this the
   * placeholder would collapse to zero height instead of reserving visible space. */
  fallbackClassName,
  context,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackClassName?: string;
  context?: MediaErrorContext;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={cn("flex min-h-24 items-center justify-center bg-frost text-ink/25", className, fallbackClassName)}
        style={style}
        role="img"
        aria-label={alt || "Image unavailable"}
      >
        <ImageOff size={20} aria-hidden />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => {
        logMediaError(src, context);
        setFailed(true);
      }}
    />
  );
}

/**
 * `fill`-mode variant for callers already inside a `relative` sized/positioned parent -- gets the
 * next/image optimization pipeline (responsive srcset, quality) that the plain-<img> variant
 * above can't. Same fallback/logging behavior.
 */
export function CmsFillImage({
  src,
  alt,
  sizes,
  className,
  style,
  priority,
  context,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  context?: MediaErrorContext;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={cn("absolute inset-0 flex items-center justify-center bg-frost text-ink/25", className)} role="img" aria-label={alt || "Image unavailable"}>
        <ImageOff size={20} aria-hidden />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      style={style}
      priority={priority}
      onError={() => {
        logMediaError(src, context);
        setFailed(true);
      }}
    />
  );
}
