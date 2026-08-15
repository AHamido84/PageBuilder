"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { HeroFrameShape } from "./hero-frame-shape";
import type { HeroRenderData, HeroResolvedProduct } from "../content-blocks";
import { resolveHref } from "../../href";

/**
 * Product Composition mode's media slot: a layered Primary/Secondary/Supporting product scene,
 * built from real Product CMS references only (`resolveHeroData` batches these -- see
 * hero-resolve.ts). Every role is optional; an unset role simply doesn't render (same
 * graceful-degradation convention as the rest of this schema). When a product has no photo yet
 * (true for the whole catalog today, see HANDOFF's "no real product photography exists" note),
 * this falls back to the exact same honest name/SKU treatment `ProductCard` and the
 * Category/Brand Grid blocks already use -- never a fabricated placeholder image.
 */
export function HeroProductComposition({ data, locale }: { data: HeroRenderData; locale: string }) {
  const reduce = useReducedMotion();
  const hasAny = data.primaryProduct || data.secondaryProduct || data.supportingProduct;
  if (!hasAny) return null;

  return (
    <div className="absolute inset-0">
      {data.supportingProduct ? (
        <ProductLayer
          product={data.supportingProduct}
          data={data}
          locale={locale}
          reduce={!!reduce}
          className="absolute bottom-[4%] start-0 z-10 h-[46%] w-[46%]"
          floatDelay={0}
          floatDistance={6}
          floatDuration={7}
        />
      ) : null}
      {data.secondaryProduct ? (
        <ProductLayer
          product={data.secondaryProduct}
          data={data}
          locale={locale}
          reduce={!!reduce}
          className="absolute end-0 top-[2%] z-20 h-[52%] w-[52%]"
          floatDelay={0.4}
          floatDistance={7}
          floatDuration={6}
        />
      ) : null}
      {data.primaryProduct ? (
        <ProductLayer
          product={data.primaryProduct}
          data={data}
          locale={locale}
          reduce={!!reduce}
          className="absolute inset-[8%] z-30"
          floatDelay={0.15}
          floatDistance={8}
          floatDuration={6.5}
        />
      ) : null}
    </div>
  );
}

function ProductLayer({
  product,
  data,
  locale,
  reduce,
  className,
  floatDelay,
  floatDistance,
  floatDuration,
}: {
  product: HeroResolvedProduct;
  data: HeroRenderData;
  locale: string;
  reduce: boolean;
  className: string;
  floatDelay: number;
  floatDistance: number;
  floatDuration: number;
}) {
  const t = useTranslations("productCard");
  const frame = (
    <HeroFrameShape
      frameStyle={data.frameStyle}
      borderStyle={data.frameBorderStyle}
      borderWidthPx={data.frameBorderWidth}
      borderOpacity={data.frameBorderOpacity}
      borderColor={data.frameBorderColor}
      glow={data.frameGlow}
      className="absolute inset-0"
    >
      {product.imageUrl ? (
        // Real product photo, no separate visible name label (an editorial scene, not a catalog
        // card) -- `alt` carries the product name for screen readers since there's no adjacent
        // visible text doing that job here, unlike the no-photo fallback below.
        <Image src={product.imageUrl} alt={product.name} fill sizes="(min-width: 1024px) 30vw, 60vw" className="object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-frost/10 p-4 text-center">
          <p className="font-display text-sm opacity-80 sm:text-base">{product.name}</p>
          <p className="font-mono-data text-[10px] opacity-40">{product.sku}</p>
        </div>
      )}
      {data.showProductBadges && product.isFeatured ? (
        <span className="absolute start-3 top-3 z-10">
          <Badge tone="featured">{t("featured")}</Badge>
        </span>
      ) : null}
    </HeroFrameShape>
  );

  const content = data.productsClickable ? (
    <Link href={resolveHref(`/products/${product.slug}`, locale)} className="absolute inset-0" aria-label={product.name}>
      {frame}
    </Link>
  ) : (
    frame
  );

  if (reduce) {
    return <div className={className}>{content}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -floatDistance, 0] }}
      transition={{ duration: floatDuration, delay: floatDelay, repeat: Infinity, ease: "easeInOut" }}
    >
      {content}
    </motion.div>
  );
}
