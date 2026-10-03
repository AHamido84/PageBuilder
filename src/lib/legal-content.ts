/**
 * Built-in text of the legal pages (Privacy / Terms / Cookies). Moved out of the route files in
 * PHASE 8 so the same text can seed the editable Page Builder versions
 * (scripts/seed-phase8-pages.ts). The routes still render this when no Page Builder page with
 * their slug is published.
 */
export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalContent {
  en: LegalSection[];
  ar: LegalSection[];
}

/** Date shown under the built-in legal page titles. */
export const LEGAL_UPDATED = "2026-08-08";

export const PRIVACY_CONTENT: LegalContent = {
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

export const TERMS_CONTENT: LegalContent = {
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

export const COOKIE_CONTENT: LegalContent = {
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
