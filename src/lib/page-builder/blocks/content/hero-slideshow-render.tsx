"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { buttonClasses } from "@/components/ui/button";
import { KineticText, Stagger, StaggerItem } from "@/lib/motion/primitives";
import { HeroFrame, HeroMediaMotion, HeroVideoLayer } from "./hero-shared";
import type { BlockRenderProps } from "../../types";
import { resolveHref } from "../../href";
import type { HeroRenderData } from "../content-blocks";

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

  const activeIndex = slides.length > 0 ? index % slides.length : 0;
  const slide = slides[activeIndex];

  useEffect(() => {
    if (slides.length < 2 || paused || !slide) return;
    timeoutRef.current = setTimeout(() => setIndex((i) => i + 1), slide.durationMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeIndex, paused, slides.length, slide]);

  if (!slide) return null;

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

  const mediaNode = !desktopUrl ? null : (
    <HeroMediaMotion key={slide.id} animation={slide.animation} className="absolute inset-0">
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
  );

  return (
    <div
      className="relative"
      role="group"
      aria-label="Hero slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <HeroFrame layout={data.layout} overlayOpacity={data.overlayOpacity} media={mediaNode} content={content} />
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
