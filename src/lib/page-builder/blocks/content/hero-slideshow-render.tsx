"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { KineticText, Stagger, StaggerItem } from "@/lib/motion/primitives";
import { DURATION, EASE_PREMIUM } from "@/lib/motion/motionTokens";
import { HeroFrame, HeroMediaMotion, HeroVideoLayer } from "./hero-shared";
import type { BlockRenderProps } from "../../types";
import { resolveHref } from "../../href";
import type { HeroRenderData } from "../content-blocks";

/** Minimum horizontal drag distance (px) before a touch gesture counts as a swipe, not a tap. */
const SWIPE_THRESHOLD = 40;

/**
 * Hero's slideshow mode: auto-advances through the enabled slides, pausing on hover (same
 * precedent as the MARQUEE block). Only the active slide's media is ever mounted -- switching
 * slides unmounts the previous one rather than keeping all N in the DOM, so a slideshow with a
 * handful of video slides doesn't pay for videos nobody's looking at. Content rotation stays
 * functional under prefers-reduced-motion (still advances on a timer) -- only each slide's own
 * entrance animation is what reduced-motion suppresses, via the same HeroMediaMotion/Stagger
 * primitives image/video mode already uses, which no-op on their own.
 */
export function HeroSlideshow({ data, locale }: BlockRenderProps<HeroRenderData>) {
  const slides = data.slides.filter((s) => s.enabled);
  // `index` only ever counts up -- wrapping (and correcting for a slide list that shrank while a
  // stale index was active, e.g. a slide got deleted/disabled mid-preview) happens here at render
  // time via modulo, rather than in an effect that would need its own setState-to-fix-state pass.
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  // Accessibility fix: a slideshow that keeps auto-advancing regardless of prefers-reduced-motion
  // is exactly the kind of auto-updating content that setting is meant to stop (WCAG 2.2.2). Manual
  // navigation (arrows, dots, swipe, keyboard) stays fully available either way.
  const reduceMotion = useReducedMotion();

  // JS's `%` can return a negative result for a negative dividend (e.g. -1 % 5 === -1, not 4) --
  // matters once Prev can decrement `index` below 0, which the original forward-only autoplay
  // never did. This normalizes into a proper [0, length) wrap in both directions.
  const activeIndex = slides.length > 0 ? ((index % slides.length) + slides.length) % slides.length : 0;
  const slide = slides[activeIndex];

  const goNext = () => setIndex((i) => i + 1);
  const goPrev = () => setIndex((i) => i - 1);

  useEffect(() => {
    if (slides.length < 2 || paused || !slide || reduceMotion) return;
    timeoutRef.current = setTimeout(goNext, slide.durationMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeIndex, paused, slides.length, slide, reduceMotion]);

  if (!slide) return null;

  function onKeyDown(e: React.KeyboardEvent) {
    if (slides.length < 2) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || slides.length < 2) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) goNext();
    else goPrev();
  }

  const media = data.slideMedia?.[slide.id];
  const desktopUrl = media?.desktopUrl;
  const mobileUrl = media?.mobileUrl || media?.desktopUrl;
  const imagePositionStyle = { objectPosition: `${data.focalX}% ${data.focalY}%` };

  const hasPrimaryCta = Boolean(slide.ctaLabel && slide.ctaUrl);
  const hasSecondaryCta = Boolean(slide.ctaLabel2 && slide.ctaUrl2);

  const content = (
    <Stagger key={slide.id}>
      {slide.eyebrow ? (
        <StaggerItem>
          <p className="manifest-strip mb-2 opacity-60">{slide.eyebrow}</p>
        </StaggerItem>
      ) : null}
      {slide.headline ? (
        <StaggerItem>
          <KineticText as="h1" text={slide.headline} className="font-display text-hero measure-ar" />
        </StaggerItem>
      ) : null}
      {slide.description ? (
        <StaggerItem>
          <p className="measure-ar mt-5 max-w-lg text-base leading-relaxed opacity-70 sm:text-lg">{slide.description}</p>
        </StaggerItem>
      ) : null}
      {hasPrimaryCta || hasSecondaryCta ? (
        <StaggerItem>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {hasPrimaryCta ? (
              <Link href={resolveHref(slide.ctaUrl, locale)} className={buttonClasses("primary", "lg")}>
                {slide.ctaLabel}
              </Link>
            ) : null}
            {hasSecondaryCta ? (
              <Link href={resolveHref(slide.ctaUrl2, locale)} className={buttonClasses("ghost-light", "lg")}>
                {slide.ctaLabel2}
              </Link>
            ) : null}
          </div>
        </StaggerItem>
      ) : null}
    </Stagger>
  );

  // Crossfade is a separate opacity animation on its own motion.div wrapping HeroMediaMotion, not a
  // change to HeroMediaMotion itself -- that component is shared with Hero's non-slideshow modes,
  // where nothing ever unmounts, so it has no `exit` animations for AnimatePresence to run. This
  // wrapper is the thing AnimatePresence actually watches; the per-slide entrance animation
  // (Ken Burns/fade/etc.) still plays independently inside it. `mode="sync"` keeps the outgoing
  // slide mounted for the fade's duration instead of an instant unmount -- the old hard-cut.
  const crossfade = data.slideTransition === "crossfade" && !reduceMotion;
  const mediaNode = !desktopUrl ? null : (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={slide.id}
        className="absolute inset-0"
        initial={crossfade ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        exit={crossfade ? { opacity: 0 } : undefined}
        transition={{ duration: crossfade ? DURATION.large : 0, ease: EASE_PREMIUM }}
      >
        <HeroMediaMotion animation={slide.animation} className="absolute inset-0">
          {slide.mediaType === "video" ? (
            <>
              <HeroVideoLayer src={desktopUrl} poster={media?.posterUrl} autoPlay muted loop className="hidden h-full w-full object-cover lg:block" style={imagePositionStyle} />
              {mobileUrl ? (
                <HeroVideoLayer src={mobileUrl} poster={media?.posterUrl} autoPlay muted loop className="h-full w-full object-cover lg:hidden" style={imagePositionStyle} />
              ) : null}
            </>
          ) : (
            <>
              <Image src={desktopUrl} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="hidden object-cover lg:block" style={imagePositionStyle} />
              {mobileUrl ? <Image src={mobileUrl} alt="" fill sizes="100vw" className="object-cover lg:hidden" style={imagePositionStyle} /> : null}
            </>
          )}
        </HeroMediaMotion>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div
      className="relative"
      role="group"
      aria-label="Hero slideshow"
      aria-roledescription="carousel"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={goPrev}
            className="absolute start-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-ink/40 p-2 text-paper backdrop-blur-sm transition hover:bg-ink/60 lg:flex"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={goNext}
            className="absolute end-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-ink/40 p-2 text-paper backdrop-blur-sm transition hover:bg-ink/60 lg:flex"
          >
            <ChevronRight size={20} />
          </button>
        </>
      ) : null}
      <HeroFrame
        layout={data.layout}
        overlayOpacity={data.overlayOpacity}
        media={mediaNode}
        content={content}
        fullBleed={
          data.layout === "full-bleed"
            ? {
                height: data.heroHeight,
                contentPosition: data.contentPosition,
                verticalAlign: data.verticalAlign,
                contentMaxWidth: data.contentMaxWidth,
                textColorMode: data.textColorMode,
                overlayDirection: data.overlayDirection,
                isRtl: locale === "ar",
              }
            : undefined
        }
      />
      {slides.length > 1 ? (
        <div className="relative z-10 mt-4 flex justify-center gap-2 lg:absolute lg:inset-x-0 lg:bottom-4 lg:mt-0">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === activeIndex}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-6 bg-current" : "w-1.5 bg-current/40 hover:bg-current/60"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
