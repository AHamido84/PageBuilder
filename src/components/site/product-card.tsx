import Link from "next/link";
import { TemperatureBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export interface ProductCardData {
  id: string;
  slug: string;
  sku: string;
  temperatureClass: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  shortDescription?: string | null;
}

export function ProductCard({ product, locale }: { product: ProductCardData; locale: string }) {
  return (
    <Link href={`/${locale}/products/${product.slug}`} className="group block">
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-frost">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-mono-data text-xs text-ink/30">{product.sku}</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="manifest-strip mb-2 text-ink/40">{product.categoryName}</p>
          <p className="mb-1 font-medium leading-snug">{product.name}</p>
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
