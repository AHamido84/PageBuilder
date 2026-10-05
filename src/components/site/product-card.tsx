"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Badge, temperatureLabel } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { IMAGE_ZOOM_CLASS, ScrollReveal } from "@/lib/motion/primitives";
import { StyledText } from "@/components/text/styled-text";
import type { RichText } from "@/lib/text-style/rich-text";

export interface ProductCardData {
  id: string;
  slug: string;
  sku: string;
  temperatureClass: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  /** PHASE 7: optional phone-only image (Product.mobileImage); shown below `sm` instead of imageUrl. */
  mobileImageUrl?: string | null;
  shortDescription?: string | null;
  isFeatured?: boolean;
  createdAt?: string | Date;
  /** Phase 5: short spec line (e.g. weight/dimensions) -- only ever real catalog data, never invented. */
  weight?: string | null;
  dimensions?: string | null;
  /** Variant products: «مقاسان: ٧ مم · ١٠ مم» / «٤ قطعيات» (src/lib/catalog/variants/core.ts). */
  variantSummary?: string | null;
  /** Variant products: query that preselects the card's variant on the product page ("size=10mm"). */
  variantQuery?: string | null;
  /** Text styling (admin), present only while text styles are enabled. */
  nameRich?: RichText;
  shortDescriptionRich?: RichText;
}

export type ProductCardImageFit = "cover" | "contain" | "natural";
export type ProductCardImagePosition = "center" | "top" | "bottom" | "left" | "right";
export type ProductCardHoverEffect = "zoom" | "lift" | "none";

export interface ProductCardDisplayOptions {
  imageFit?: ProductCardImageFit;
  imagePosition?: ProductCardImagePosition;
  hoverEffect?: ProductCardHoverEffect;
  showSpecs?: boolean;
  showCta?: boolean;
  ctaLabel?: string;
}

const NEW_WINDOW_DAYS = 30;

const OBJECT_POSITION_CLASS: Record<ProductCardImagePosition, string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

function isRecentlyAdded(createdAt?: string | Date): boolean {
  if (!createdAt) return false;
  const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return days >= 0 && days <= NEW_WINDOW_DAYS;
}

export function ProductCard({
  product,
  locale,
  imageFit = "cover",
  imagePosition = "center",
  hoverEffect = "zoom",
  showSpecs = true,
  showCta = true,
  ctaLabel,
}: { product: ProductCardData; locale: string } & ProductCardDisplayOptions) {
  const t = useTranslations("productCard");
  const isNew = isRecentlyAdded(product.createdAt);
  const spec = [product.weight, product.dimensions].filter(Boolean).join(" · ");
  const hoverImageClass = hoverEffect === "zoom" ? IMAGE_ZOOM_CLASS : "";
  const hoverCardClass = hoverEffect === "lift" ? "hover:-translate-y-2" : "";

  return (
    // Phase 10: reveals in place on scroll -- `as={Link}` renders the SAME <a> element (no extra
    // wrapper), so this is safe inside any grid (including bento layouts with col-span/row-span)
    // and the carousel track alike. `href` passes straight through via ScrollReveal's rest-spread.
    <ScrollReveal
      as={Link}
      href={`/${locale}/products/${product.slug}${product.variantQuery ? `?${product.variantQuery}` : ""}`}
      variant="fade-up"
      className="group block"
    >
      {/* Golden Seven v7 card (design 04): photo on top, dark teal body with cream text. */}
      <div data-ui-card className={`flex h-full flex-col overflow-hidden rounded-[12px] bg-[var(--g7-teal-900)] text-[var(--g7-cream-50)] transition-transform duration-300 ease-[var(--ease-premium)] ${hoverCardClass}`}>
        <div
          className={
            imageFit === "natural"
              ? "relative w-full overflow-hidden bg-[var(--g7-teal-800)]"
              : "relative aspect-[525/472] w-full overflow-hidden bg-[var(--g7-teal-800)]"
          }
        >
          {(product.isFeatured || isNew) && (
            <span className="absolute start-4 top-4 z-10">
              <Badge tone={product.isFeatured ? "featured" : "new"}>{product.isFeatured ? t("featured") : t("new")}</Badge>
            </span>
          )}
          {product.imageUrl ? (
            imageFit === "natural" && product.imageWidth && product.imageHeight ? (
              <Image
                src={product.imageUrl}
                alt=""
                width={product.imageWidth}
                height={product.imageHeight}
                sizes="(min-width: 1024px) 23vw, (min-width: 640px) 33vw, 50vw"
                className={`h-auto w-full transition-transform duration-500 ease-[var(--ease-premium)] ${hoverImageClass}`}
              />
            ) : (
              <>
                <Image
                  src={product.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 23vw, (min-width: 640px) 33vw, 50vw"
                  className={`transition-transform duration-500 ease-[var(--ease-premium)] ${imageFit === "contain" ? "object-contain" : "object-cover"} ${OBJECT_POSITION_CLASS[imagePosition]} ${hoverImageClass} ${product.mobileImageUrl ? "hidden sm:block" : ""}`}
                />
                {product.mobileImageUrl ? (
                  <Image
                    src={product.mobileImageUrl}
                    alt=""
                    fill
                    sizes="50vw"
                    className={`transition-transform duration-500 ease-[var(--ease-premium)] sm:hidden ${imageFit === "contain" ? "object-contain" : "object-cover"} ${OBJECT_POSITION_CLASS[imagePosition]} ${hoverImageClass}`}
                  />
                ) : null}
              </>
            )
          ) : (
            <div className="flex h-full min-h-40 w-full items-center justify-center">
              <span className="font-mono-data text-xs text-[var(--g7-cream-50)]/40">{product.sku}</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
          <div className="flex-1">
          <p className="text-sm font-light text-[var(--g7-cream-50)]/75">{product.categoryName}</p>
          <p className="t-product mt-1.5 font-medium transition-colors group-hover:text-[var(--g7-gold-500)]">
            <StyledText text={product.name} rich={product.nameRich} />
          </p>
          {product.variantSummary ? (
            <p data-variant-summary className="mt-1 text-sm font-light text-[var(--g7-cream-50)]/80">
              {product.variantSummary}
            </p>
          ) : null}
          {product.shortDescription ? <p className="mt-1.5 line-clamp-2 text-sm font-light text-[var(--g7-cream-50)]/70">
              <StyledText text={product.shortDescription} rich={product.shortDescriptionRich} />
            </p> : null}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--g7-cream-50)]/20 pt-3">
            <span className="text-base font-light">{showSpecs && spec ? spec : product.sku}</span>
            <span className="rounded-[6px] bg-[var(--g7-gold-500)] px-3 py-0.5 text-xs font-bold text-[var(--g7-cream-50)]">{temperatureLabel(product.temperatureClass, locale)}</span>
          </div>
          {showCta ? (
            <span className="mt-4 inline-flex items-center gap-3 text-base font-light transition-colors group-hover:text-[var(--g7-gold-500)]">
              {ctaLabel || t("viewProduct")}
              <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full border border-current">
                <ArrowUpRight size={14} strokeWidth={1.6} />
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </ScrollReveal>
  );
}
