import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { normalizeHeaderLogoSettings } from "@/lib/site-settings/header-logo";
import Link from "next/link";
import { TextStylesToggle } from "./text-styles-toggle";
import { ProductsPageToggle } from "./products-page-toggle";
import { SYSTEM_PAGES } from "@/lib/page-builder/system-pages";
import { parseFooterSettings } from "@/lib/site-settings/footer";
import { GeneralForm, ContactForm, SocialForm, HoursForm, SeoForm, FooterForm, type Settings } from "./settings-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "read");

  let record = await prisma.siteSetting.findUnique({
    where: { id: "singleton" },
    include: { logo: true, favicon: true, defaultOgImage: true, footerLogo: true },
  });

  if (!record) {
    record = await prisma.siteSetting.create({
      data: { id: "singleton", siteNameEn: "Seven Eleven Trading", siteNameAr: "سفن إليفن للتجارة" },
      include: { logo: true, favicon: true, defaultOgImage: true, footerLogo: true },
    });
  }

  const systemPages = await prisma.page.findMany({ where: { slug: { in: Object.keys(SYSTEM_PAGES) } }, select: { id: true, slug: true, status: true } });

  const settings: Settings = {
    siteNameEn: record.siteNameEn,
    siteNameAr: record.siteNameAr,
    logoId: record.logoId,
    logo: record.logo,
    headerLogo: normalizeHeaderLogoSettings(record.headerLogo),
    faviconId: record.faviconId,
    favicon: record.favicon,
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone,
    whatsapp: record.whatsapp,
    address: record.address,
    mapEmbedUrl: record.mapEmbedUrl,
    socialLinks: record.socialLinks as Settings["socialLinks"],
    businessHours: record.businessHours as Settings["businessHours"],
    seoDefaultTitleEn: record.seoDefaultTitleEn,
    seoDefaultTitleAr: record.seoDefaultTitleAr,
    seoDefaultDescriptionEn: record.seoDefaultDescriptionEn,
    seoDefaultDescriptionAr: record.seoDefaultDescriptionAr,
    analyticsId: record.analyticsId,
    gtmId: record.gtmId,
    metaPixelId: record.metaPixelId,
    defaultOgImageId: record.defaultOgImageId,
    defaultOgImage: record.defaultOgImage,
    footerAboutEn: record.footerAboutEn,
    footerAboutAr: record.footerAboutAr,
    newsletterTitleEn: record.newsletterTitleEn,
    newsletterTitleAr: record.newsletterTitleAr,
    newsletterBodyEn: record.newsletterBodyEn,
    newsletterBodyAr: record.newsletterBodyAr,
    footerLogoId: record.footerLogoId,
    footerLogo: record.footerLogo,
    footerSettings: parseFooterSettings(record.footerSettings),
  };

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Settings</h1>
      <Tabs
        items={[
          { key: "general", label: "General", content: <GeneralForm settings={settings} /> },
          { key: "contact", label: "Contact", content: <ContactForm settings={settings} /> },
          { key: "social", label: "Social", content: <SocialForm settings={settings} /> },
          { key: "hours", label: "Business hours", content: <HoursForm settings={settings} /> },
          { key: "seo", label: "SEO defaults", content: <SeoForm settings={settings} /> },
          { key: "footer", label: "Footer", content: <FooterForm settings={settings} /> },
          {
            key: "text-styles",
            label: "تنسيق النصوص",
            content: <TextStylesToggle enabled={record.textStylesEnabled} envOverride={process.env.TEXT_STYLES_ENABLED?.trim().toLowerCase() || null} />,
          },
          {
            key: "products-page",
            label: "صفحات المنتجات",
            content: (
              <ProductsPageToggle
                enabled={record.productsPageBuilderEnabled}
                envOverride={process.env.PRODUCTS_PAGE_BUILDER?.trim().toLowerCase() || null}
                pages={systemPages.map((p) => ({ id: p.id, status: p.status, label: `${SYSTEM_PAGES[p.slug]?.labelAr ?? p.slug} · ${SYSTEM_PAGES[p.slug]?.labelEn ?? ""}` }))}
              />
            ),
          },
          {
            key: "appearance",
            label: "Appearance",
            content: (
              <p className="text-sm text-neutral-400">
                Colors, fonts, spacing, corners, shadows and buttons now have their own page with a live preview:{" "}
                <Link href="/admin/appearance" className="text-sky-400 hover:underline">
                  Open Appearance
                </Link>
              </p>
            ),
          },
        ]}
      />
    </div>
  );
}
