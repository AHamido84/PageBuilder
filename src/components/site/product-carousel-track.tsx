"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardData, type ProductCardDisplayOptions } from "./product-card";
import { useIsRtl } from "@/lib/motion/primitives";
import { cn } from "@/lib/cn";

/**
 * Phase 3 premium redesign: replaces the previous plain CSS scroll-snap strip with a real embla
 * carousel (peeking next slide, momentum drag, prev/next controls) -- the one new dependency this
 * redesign adds (see HANDOFF). `direction` is passed explicitly rather than left to the DOM: embla
 * needs to know RTL at init time to reverse its drag/scroll math, not just mirror visually.
 */
export function ProductCarouselTrack({
  cards,
  locale,
  ...displayOptions
}: { cards: ProductCardData[]; locale: string } & ProductCardDisplayOptions) {
  const isRtl = useIsRtl();
  const [emblaRef, emblaApi] = useEmblaCarousel({ direction: isRtl ? "rtl" : "ltr", align: "start", containScroll: "trimSnaps", dragFree: false });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // embla only fires "select" on interaction, never on mount, so the initial prev/next button
    // state has to be read once here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5">
          {cards.map((card) => (
            <div key={card.id} className="min-w-0 shrink-0 grow-0 basis-[72%] sm:basis-[42%] lg:basis-[27%]">
              <ProductCard product={card} locale={locale} {...displayOptions} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label="Previous"
          disabled={!canPrev}
          onClick={() => emblaApi?.scrollPrev()}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full border border-line-strong transition-colors",
            canPrev ? "hover:bg-ink hover:text-paper" : "opacity-30"
          )}
        >
          <ChevronLeft className="rtl:rotate-180" size={18} />
        </button>
        <button
          type="button"
          aria-label="Next"
          disabled={!canNext}
          onClick={() => emblaApi?.scrollNext()}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full border border-line-strong transition-colors",
            canNext ? "hover:bg-ink hover:text-paper" : "opacity-30"
          )}
        >
          <ChevronRight className="rtl:rotate-180" size={18} />
        </button>
      </div>
    </div>
  );
}
