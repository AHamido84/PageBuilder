import { SITE_URL } from "./metadata";

/** Renders as-is inside a <script type="application/ld+json">; escape "</" so the payload
 *  can never prematurely close the surrounding script tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

interface OrgSchemaInput {
  siteName: string;
  logoUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  socialLinks?: { facebook?: string; instagram?: string; linkedin?: string; twitter?: string } | null;
  address?: string | null;
}

export function organizationSchema(input: OrgSchemaInput) {
  const sameAs = Object.values(input.socialLinks ?? {}).filter((v): v is string => Boolean(v));
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.siteName,
    url: SITE_URL,
    ...(input.logoUrl ? { logo: input.logoUrl } : {}),
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
    ...(input.address ? { address: { "@type": "PostalAddress", streetAddress: input.address } } : {}),
  };
}

interface ProductSchemaInput {
  name: string;
  description?: string | null;
  sku: string;
  imageUrls: string[];
  brandName?: string | null;
  url: string;
  isAvailable: boolean;
}

export function productSchema(input: ProductSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    sku: input.sku,
    ...(input.description ? { description: input.description } : {}),
    ...(input.imageUrls.length ? { image: input.imageUrls } : {}),
    ...(input.brandName ? { brand: { "@type": "Brand", name: input.brandName } } : {}),
    url: input.url,
    offers: {
      "@type": "Offer",
      url: input.url,
      availability: input.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      // No public list price on this wholesale B2B catalog -- omit `price` rather than invent one.
    },
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
