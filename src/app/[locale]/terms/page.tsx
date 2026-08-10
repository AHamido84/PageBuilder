import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return buildMetadata({ locale, path: "/terms", fallbackTitle: t("termsTitle") });
}

const content = {
  en: [
    {
      heading: "About this site",
      body: "This website provides information about Seven Eleven Trading's products and services and lets businesses request quotes. It is not an online store — no purchases, payments, or binding orders are made through this site.",
    },
    {
      heading: "Quote requests",
      body: "Submitting a quote request does not create a contract. Pricing, availability, and order terms are confirmed separately with our team before any order is placed.",
    },
    {
      heading: "Content & intellectual property",
      body: "The content on this site, including text, images, and the Seven Eleven Trading name and logo, belongs to Seven Eleven Trading unless otherwise noted, and may not be reproduced without permission.",
    },
    {
      heading: "Accuracy",
      body: "We work to keep product and category information accurate, but availability and specifications can change. Confirm details with our team before ordering.",
    },
    {
      heading: "Liability",
      body: "This site is provided as is. Seven Eleven Trading is not liable for losses arising from reliance on information published here without direct confirmation from our team.",
    },
  ],
  ar: [
    {
      heading: "عن هذا الموقع",
      body: "يقدّم هذا الموقع معلومات عن منتجات وخدمات سفن إليفن للتجارة، ويتيح للشركات طلب عروض أسعار. هذا الموقع ليس متجرًا إلكترونيًا — لا تتم أي عمليات شراء أو دفع أو طلبات ملزمة عبره.",
    },
    {
      heading: "طلبات عروض الأسعار",
      body: "تقديم طلب عرض سعر لا ينشئ عقدًا. يتم تأكيد الأسعار والتوفر وشروط الطلب بشكل منفصل مع فريقنا قبل تنفيذ أي طلب.",
    },
    {
      heading: "المحتوى والملكية الفكرية",
      body: "محتوى هذا الموقع، بما في ذلك النصوص والصور واسم وشعار سفن إليفن للتجارة، مملوك لسفن إليفن للتجارة ما لم يُذكر خلاف ذلك، ولا يجوز إعادة إنتاجه دون إذن.",
    },
    {
      heading: "الدقة",
      body: "نعمل على إبقاء معلومات المنتجات والفئات دقيقة، إلا أن التوفر والمواصفات قد تتغير. يرجى تأكيد التفاصيل مع فريقنا قبل الطلب.",
    },
    {
      heading: "المسؤولية",
      body: "يُقدَّم هذا الموقع كما هو. سفن إليفن للتجارة غير مسؤولة عن أي خسائر ناتجة عن الاعتماد على المعلومات المنشورة هنا دون تأكيد مباشر من فريقنا.",
    },
  ],
};

export default function TermsPage() {
  return <LegalPage titleKey="termsTitle" content={content} />;
}
