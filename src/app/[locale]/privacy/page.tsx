import { LegalPage } from "@/components/site/legal-page";

export const dynamic = "force-dynamic";

const content = {
  en: [
    {
      heading: "Information we collect",
      body: "Through our contact and quote request forms, we collect the information you provide: your name, company name, email address, phone number, and any message you send. We also automatically record your IP address and browser information for security and spam prevention.",
    },
    {
      heading: "How we use it",
      body: "We use this information to respond to your inquiry, prepare quotes, and keep a record of your request. We do not sell or rent your information to third parties.",
    },
    {
      heading: "Newsletter",
      body: "If you subscribe to our newsletter, we store your email address to send you updates about our product categories. You can unsubscribe at any time by contacting us.",
    },
    {
      heading: "Cookies",
      body: "See our Cookie Policy for details on the cookies this site uses.",
    },
    {
      heading: "Data retention & requests",
      body: "We retain inquiry records for as long as needed to respond to your request and maintain business records. To request access to, correction of, or deletion of your information, contact us using the details on our Contact page.",
    },
  ],
  ar: [
    {
      heading: "المعلومات التي نجمعها",
      body: "من خلال نماذج التواصل وطلب عروض الأسعار، نجمع المعلومات التي تقدمها: اسمك واسم شركتك وبريدك الإلكتروني ورقم هاتفك وأي رسالة ترسلها. كما نسجل تلقائيًا عنوان IP ومعلومات المتصفح لأغراض الأمان ومنع الرسائل غير المرغوبة.",
    },
    {
      heading: "كيف نستخدمها",
      body: "نستخدم هذه المعلومات للرد على استفسارك وإعداد عروض الأسعار والاحتفاظ بسجل لطلبك. لا نبيع معلوماتك أو نؤجرها لأطراف ثالثة.",
    },
    {
      heading: "النشرة البريدية",
      body: "إذا اشتركت في نشرتنا البريدية، نحتفظ ببريدك الإلكتروني لإرسال تحديثات حول فئات منتجاتنا. يمكنك إلغاء الاشتراك في أي وقت بالتواصل معنا.",
    },
    {
      heading: "ملفات تعريف الارتباط",
      body: "راجع سياسة ملفات تعريف الارتباط لدينا لمعرفة التفاصيل حول الملفات التي يستخدمها هذا الموقع.",
    },
    {
      heading: "الاحتفاظ بالبيانات والطلبات",
      body: "نحتفظ بسجلات الاستفسارات للمدة اللازمة للرد على طلبك والحفاظ على السجلات التجارية. لطلب الوصول إلى معلوماتك أو تصحيحها أو حذفها، تواصل معنا عبر البيانات الموجودة في صفحة التواصل.",
    },
  ],
};

export default function PrivacyPage() {
  return <LegalPage titleKey="privacyTitle" content={content} />;
}
