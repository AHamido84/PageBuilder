import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { GeneralForm, ContactForm, SocialForm, HoursForm, SeoForm, FooterForm, type Settings } from "./settings-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "read");

  let record = await prisma.siteSetting.findUnique({
    where: { id: "singleton" },
    include: { logo: true, favicon: true, defaultOgImage: true },
  });

  if (!record) {
    record = await prisma.siteSetting.create({
      data: { id: "singleton", siteNameEn: "Seven Eleven Trading", siteNameAr: "سفن إليفن للتجارة" },
      include: { logo: true, favicon: true, defaultOgImage: true },
    });
  }

  const settings: Settings = {
    siteNameEn: record.siteNameEn,
    siteNameAr: record.siteNameAr,
    logoId: record.logoId,
    logo: record.logo,
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
    defaultOgImageId: record.defaultOgImageId,
    defaultOgImage: record.defaultOgImage,
    footerAboutEn: record.footerAboutEn,
    footerAboutAr: record.footerAboutAr,
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
        ]}
      />
    </div>
  );
}
