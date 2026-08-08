import { LegalPage } from "@/components/site/legal-page";

export const dynamic = "force-dynamic";

const content = {
  en: [
    {
      heading: "Essential cookies",
      body: "This site uses a small number of cookies required for it to function: one to remember your language preference (Arabic or English), and one to keep administrators securely signed in to the content management system. These are not used for tracking or advertising.",
    },
    {
      heading: "No third-party tracking",
      body: "This site does not currently use analytics, advertising, or third-party tracking cookies.",
    },
    {
      heading: "Managing cookies",
      body: "You can block or delete cookies through your browser settings. Blocking the language-preference cookie may cause the site to default to Arabic on each visit; blocking the admin session cookie will prevent staff from staying signed in to the dashboard.",
    },
  ],
  ar: [
    {
      heading: "ملفات تعريف الارتباط الأساسية",
      body: "يستخدم هذا الموقع عددًا محدودًا من ملفات تعريف الارتباط اللازمة لعمله: ملف لتذكّر لغتك المفضلة (عربي أو إنجليزي)، وملف لإبقاء المسؤولين مسجّلين دخولهم بأمان إلى نظام إدارة المحتوى. لا تُستخدم هذه الملفات للتتبع أو الإعلانات.",
    },
    {
      heading: "لا تتبع من أطراف ثالثة",
      body: "لا يستخدم هذا الموقع حاليًا أدوات تحليلات أو إعلانات أو ملفات تعريف ارتباط من أطراف ثالثة.",
    },
    {
      heading: "إدارة ملفات تعريف الارتباط",
      body: "يمكنك حظر أو حذف ملفات تعريف الارتباط من إعدادات متصفحك. حظر ملف تفضيل اللغة قد يجعل الموقع يعرض العربية افتراضيًا في كل زيارة؛ وحظر ملف جلسة الإدارة سيمنع الموظفين من البقاء مسجّلين دخولهم إلى لوحة التحكم.",
    },
  ],
};

export default function CookiesPage() {
  return <LegalPage titleKey="cookieTitle" content={content} />;
}
