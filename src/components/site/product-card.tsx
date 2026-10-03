"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge, TemperatureBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Arrow } from "@/components/ui/arrow";
import { useTranslations } from "next-intl";
import { IMAGE_ZOOM_CLASS, ScrollReveal } from "@/lib/motion/primitives";

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
    <ScrollReveal as={Link} href={`/${locale}/products/${product.slug}`} variant="fade-up" className="group block">
      <Card variant="product" className={`overflow-hidden p-0 ${hoverCardClass}`}>
        <div
          className={
            imageFit === "natural"
              ? "relative w-full overflow-hidden bg-frost"
              : "relative aspect-[4/5] w-full overflow-hidden bg-frost"
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
              <span className="font-mono-data text-xs text-ink/30">{product.sku}</span>
            </div>
          )}
        </div>
        <div className="p-5">
          <p className="manifest-strip mb-2 text-ink/40">{product.categoryName}</p>
          <p className="mb-1 font-display text-lg leading-snug transition-colors group-hover:text-harbor">{product.name}</p>
          {product.shortDescription ? <p className="mb-2 line-clamp-2 text-sm text-ink/55">{product.shortDescription}</p> : null}
          {showSpecs && spec ? <p className="font-mono-data mb-2 text-[11px] uppercase tracking-[0.08em] text-ink/45">{spec}</p> : null}
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="font-mono-data text-xs text-ink/40">{product.sku}</span>
            <TemperatureBadge value={product.temperatureClass} locale={locale} />
          </div>
          {showCta ? (
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-harbor transition-transform duration-300 group-hover:translate-x-1">
              {ctaLabel || t("viewProduct")} <Arrow />
            </span>
          ) : null}
        </div>
      </Card>
    </ScrollReveal>
  );
}
