import { StyledText } from "@/components/text/styled-text";
import { richOf } from "@/lib/text-style/rich-text";
import { ProductMainSection, ProductRelatedSection, type ProductPageContext } from "@/app/[locale]/products/[slug]/product-sections";
import type { BlockRenderProps } from "../../types";
import type { ProductDetailsData, ProductRelatedData } from "../catalog-blocks";

/** The product template's fixed block: the product page's main section, for this request's product. */
export async function ProductDetailsRender({ context }: BlockRenderProps<ProductDetailsData>) {
  const product = context?.product as ProductPageContext | undefined;
  if (!product) return null; // only meaningful on /products/[slug]
  return <ProductMainSection {...product} />;
}

export async function ProductRelatedRender({ data, locale, context }: BlockRenderProps<ProductRelatedData>) {
  const product = context?.product as ProductPageContext | undefined;
  if (!product) return null;
  return <ProductRelatedSection related={product.related} locale={locale} title={data.heading ? <StyledText text={data.heading} rich={richOf(data, "heading")} /> : undefined} />;
}
