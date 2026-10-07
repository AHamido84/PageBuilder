import { SITE_URL } from "./metadata";

/** Renders as-is inside a <script type="application/ld+json">; escape "</" so the payload
 *  can never prematurely close the surrounding script tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

interface OrgSchemaInput {
  siteName: string;
  alternateName?: string | null;
  logoUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  socialLinks?: { facebook?: string; instagram?: string; linkedin?: string; twitter?: string } | null;
  address?: string | null;
  /** Square logo (Google wants >= 112x112); emitted as an ImageObject with its size. */
  logoSize?: number | null;
  legalName?: string | null;
  /** Locality-level address (city + ISO country) when there is no street address. */
  addressLocality?: string | null;
  addressCountry?: string | null;
  /** Official profiles; takes precedence over socialLinks when non-empty. */
  sameAs?: readonly string[] | null;
}

export function organizationSchema(input: OrgSchemaInput) {
  const sameAs = input.sameAs?.length ? [...input.sameAs] : Object.values(input.socialLinks ?? {}).filter((v): v is string => Boolean(v));
  const logo = input.logoUrl
    ? input.logoSize
      ? { "@type": "ImageObject", url: input.logoUrl, width: input.logoSize, height: input.logoSize }
      : input.logoUrl
    : null;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: input.siteName,
    ...(input.alternateName ? { alternateName: input.alternateName } : {}),
    ...(input.legalName ? { legalName: input.legalName } : {}),
    url: SITE_URL,
    ...(logo ? { logo } : {}),
    ...(input.contactPhone ? { telephone: input.contactPhone } : {}),
    ...(input.contactEmail ? { email: input.contactEmail } : {}),
    ...(input.addressLocality
      ? { address: { "@type": "PostalAddress", addressLocality: input.addressLocality, ...(input.addressCountry ? { addressCountry: input.addressCountry } : {}) } }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(input.contactEmail || input.contactPhone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            ...(input.contactEmail ? { email: input.contactEmail } : {}),
            ...(input.contactPhone ? { telephone: input.contactPhone } : {}),
          },
        }
      : {}),
    ...(input.address && !input.addressLocality ? { address: { "@type": "PostalAddress", streetAddress: input.address } } : {}),
  };
}

interface ProductSchemaInput {
  name: string;
  description?: string | null;
  sku: string;
  imageUrls: string[];
  brandName?: string | null;
  url: string;
  category?: string | null;
  /** Pack weight as entered in the catalog, e.g. "18 كجم" / "2.5 kg". */
  weight?: string | null;
}

const WEIGHT_UNITS: Record<string, string> = { "كجم": "KGM", "كغ": "KGM", kg: "KGM", "جم": "GRM", "غ": "GRM", g: "GRM", "جرام": "GRM" };

/** "18 كجم" -> QuantitativeValue (KGM); anything unparseable stays a plain additionalProperty. */
function weightProperties(weight: string | null | undefined) {
  if (!weight) return {};
  const ascii = weight.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace("٫", ".");
  const match = ascii.match(/^\s*(\d+(?:[.,]\d+)?)\s*([^\s\d]+)\s*$/);
  const unitCode = match ? WEIGHT_UNITS[match[2].toLowerCase()] : undefined;
  if (match && unitCode) return { weight: { "@type": "QuantitativeValue", value: Number(match[1].replace(",", ".")), unitCode } };
  return { additionalProperty: [{ "@type": "PropertyValue", name: "weight", value: weight }] };
}

/** Quote-based wholesale catalog: no offers, price, availability or reviews -- none of it is published data. */
export function productSchema(input: ProductSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    sku: input.sku,
    ...(input.description ? { description: input.description } : {}),
    ...(input.imageUrls.length ? { image: input.imageUrls } : {}),
    ...(input.brandName ? { brand: { "@type": "Brand", name: input.brandName } } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...weightProperties(input.weight),
    url: input.url,
  };
}

/** schema.org properties for `variesBy`; other (admin-created) option keys are passed as plain text. */
const VARIES_BY: Record<string, string> = {
  size: "https://schema.org/size",
  color: "https://schema.org/color",
  weight: "https://schema.org/weight",
  shape: "https://schema.org/pattern",
  packaging: "https://schema.org/size",
  flavor: "https://schema.org/flavor",
};

interface ProductGroupSchemaInput {
  name: string;
  description?: string | null;
  productGroupId: string;
  brandName?: string | null;
  url: string;
  category?: string | null;
  /** Option keys, e.g. ["cut", "weight"]. */
  variesBy: string[];
  variants: {
    name: string;
    description?: string | null;
    sku: string | null;
    imageUrls: string[];
    url: string;
    properties: { name: string; value: string }[];
  }[];
}

/** Variant product: ProductGroup + hasVariant Products. Quote-based catalog: no offers, no price. */
export function productGroupSchema(input: ProductGroupSchemaInput) {
  const brand = input.brandName ? { brand: { "@type": "Brand", name: input.brandName } } : {};
  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    productGroupID: input.productGroupId,
    url: input.url,
    ...brand,
    ...(input.category ? { category: input.category } : {}),
    variesBy: [...new Set(input.variesBy.map((key) => VARIES_BY[key] ?? key))],
    hasVariant: input.variants.map((v) => ({
      "@type": "Product",
      name: v.name,
      ...(v.description ? { description: v.description } : {}),
      ...(v.sku ? { sku: v.sku } : {}),
      ...(v.imageUrls.length ? { image: v.imageUrls } : {}),
      url: v.url,
      ...brand,
      additionalProperty: v.properties.map((p) => ({ "@type": "PropertyValue", name: p.name, value: p.value })),
    })),
  };
}

interface ArticleSchemaInput {
  headline: string;
  description?: string | null;
  imageUrl?: string | null;
  authorName?: string | null;
  publishedAt: string;
  updatedAt?: string | null;
  url: string;
}

export function articleSchema(input: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    ...(input.imageUrl ? { image: [input.imageUrl] } : {}),
    datePublished: input.publishedAt,
    dateModified: input.updatedAt || input.publishedAt,
    ...(input.authorName ? { author: { "@type": "Person", name: input.authorName } } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
  };
}

interface LocalBusinessInput {
  name: string;
  alternateName?: string | null;
  url: string;
  logoUrl?: string | null;
  imageUrl?: string | null;
  telephone?: string | null;
  email?: string | null;
  addressLocality: string;
  addressCountry: string;
  areaServed: string;
  description?: string | null;
}

/** Homepage LocalBusiness, tied to the site-wide Organization node by @id. */
export function localBusinessSchema(input: LocalBusinessInput) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: input.name,
    ...(input.alternateName ? { alternateName: input.alternateName } : {}),
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.logoUrl ? { logo: input.logoUrl } : {}),
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.email ? { email: input.email } : {}),
    address: { "@type": "PostalAddress", addressLocality: input.addressLocality, addressCountry: input.addressCountry },
    areaServed: { "@type": "Country", name: input.areaServed },
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
  };
}

export function websiteSchema(input: { name: string; alternateName?: string | null; url: string; inLanguage: string[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: input.name,
    ...(input.alternateName ? { alternateName: input.alternateName } : {}),
    url: input.url,
    inLanguage: input.inLanguage,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
