"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge, TemperatureBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export interface ProductCardData {
  id: string;
  slug: string;
  sku: string;
  temperatureClass: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  shortDescription?: string | null;
  isFeatured?: boolean;
  createdAt?: string | Date;
}

const NEW_WINDOW_DAYS = 30;

function isRecentlyAdded(createdAt?: string | Date): boolean {
  if (!createdAt) return false;
  const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return days >= 0 && days <= NEW_WINDOW_DAYS;
}

export function ProductCard({ product, locale }: { product: ProductCardData; locale: string }) {
  const t = useTranslations("productCard");
  const isNew = isRecentlyAdded(product.createdAt);

  return (
    <Link href={`/${locale}/products/${product.slug}`} className="group block">
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-frost">
          {(product.isFeatured || isNew) && (
            <span className="absolute start-3 top-3 z-10">
              <Badge tone={product.isFeatured ? "featured" : "new"}>{product.isFeatured ? t("featured") : t("new")}</Badge>
            </span>
          )}
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 23vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 ease-[var(--ease-premium)] group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-mono-data text-xs text-ink/30">{product.sku}</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="manifest-strip mb-2 text-ink/40">{product.categoryName}</p>
          <p className="mb-1 font-medium leading-snug transition-colors group-hover:text-harbor">{product.name}</p>
          {product.shortDescription ? <p className="mb-2 line-clamp-2 text-sm text-ink/55">{product.shortDescription}</p> : null}
          <div className="flex items-center justify-between">
            <span className="font-mono-data text-xs text-ink/40">{product.sku}</span>
            <TemperatureBadge value={product.temperatureClass} locale={locale} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
