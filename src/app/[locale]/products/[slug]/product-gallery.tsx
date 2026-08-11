"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { DURATION, EASE_PREMIUM } from "@/lib/motion/motionTokens";

interface MediaRef {
  id: string;
  url: string;
}

interface MediaItem extends MediaRef {
  type: "image" | "video";
}

export function ProductGallery({ images, videos, productName }: { images: MediaRef[]; videos: MediaRef[]; productName: string }) {
  const t = useTranslations("productDetail");
  const items: MediaItem[] = [
    ...images.map((item) => ({ ...item, type: "image" as const })),
    ...videos.map((item) => ({ ...item, type: "video" as const })),
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const active = items[activeIndex];

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setActiveIndex((i) => (i + 1) % items.length);
      if (e.key === "ArrowLeft") setActiveIndex((i) => (i - 1 + items.length) % items.length);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen, items.length]);

  if (items.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius-lg)] bg-frost">
        <span className="font-mono-data text-sm text-ink/30">{productName}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-frost">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.standard, ease: EASE_PREMIUM }}
            className="absolute inset-0"
          >
            {active.type === "image" ? (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="group/gallery relative block h-full w-full cursor-zoom-in"
                aria-label={t("galleryOpenImage")}
              >
                <Image
                  src={active.url}
                  alt={productName}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  priority={activeIndex === 0}
                  className="object-cover transition-transform duration-500 ease-[var(--ease-premium)] group-hover/gallery:scale-[1.03]"
                />
              </button>
            ) : (
              <video controls className="h-full w-full object-cover" src={active.url} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-3">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-[var(--radius-sm)] outline outline-2 outline-offset-1 transition-[outline-color,opacity] duration-200",
                index === activeIndex ? "outline-wheat opacity-100" : "outline-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={item.type === "video" ? t("galleryShowVideo") : t("galleryShowImage", { index: index + 1 })}
              aria-current={index === activeIndex}
            >
              {item.type === "image" ? (
                <Image src={item.url} alt="" fill sizes="120px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-ink text-paper">
                  <Play size={16} aria-hidden="true" />
                </span>
              )}
            </button>
          ))}
        </div>
      ) : null}

      <AnimatePresence>
        {lightboxOpen && active.type === "image" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.standard, ease: EASE_PREMIUM }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/92 p-4 sm:p-10"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={productName}
          >
            <button
              type="button"
              autoFocus
              onClick={() => setLightboxOpen(false)}
              className="absolute end-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-paper/30 text-paper transition-colors hover:bg-paper hover:text-ink"
              aria-label={t("galleryClose")}
            >
              <X size={18} />
            </button>

            {items.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((i) => (i - 1 + items.length) % items.length);
                  }}
                  className="flip-rtl absolute start-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-paper/30 text-paper transition-colors hover:bg-paper hover:text-ink"
                  aria-label={t("galleryPrevious")}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((i) => (i + 1) % items.length);
                  }}
                  className="flip-rtl absolute end-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-paper/30 text-paper transition-colors hover:bg-paper hover:text-ink"
                  aria-label={t("galleryNext")}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            ) : null}

            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="relative h-full w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={active.url} alt={productName} fill sizes="90vw" className="object-contain" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
