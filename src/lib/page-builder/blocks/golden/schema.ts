import { z } from "zod";

/**
 * Golden Seven home v7 block data (one schema per design section, design-assets/reference/01..09).
 * Every text field is per-locale (dataEn/dataAr), every image is a Media Library ref {id,url} --
 * defaults point at the static design photos in /public/images/home (id "static:<name>") until an
 * editor picks a library image.
 */

const media = z.object({ id: z.string(), url: z.string() });
const text = (max = 300) => z.string().max(max).optional().default("");
/** Text-on-photo position: physical side of the photo + vertical placement, plus a vw nudge. */
/** Text position on a photo: physical left/center/right, or "start"/"end" which follow the language (start = right in Arabic). */
const textX = (d: "left" | "center" | "right") => z.enum(["left", "center", "right", "start", "end"]).default(d);
const textY = (d: "top" | "center" | "bottom") => z.enum(["top", "center", "bottom"]).default(d);
const nudge = z.number().min(-20).max(20).default(0);

export const g7HeroSchema = z.object({
  image: media.nullable().default(null),
  mobileImage: media.nullable().default(null),
  imageAlt: text(200),
  eyebrow: text(80),
  headingLine1: text(80),
  headingLine2: text(80),
  primaryLabel: text(60),
  primaryUrl: text(300),
  secondaryLabel: text(60),
  secondaryUrl: text(300),
  caption: text(160),
  textX: textX("right"),
  textY: textY("center"),
  offsetX: nudge,
  offsetY: nudge,
});
export type G7HeroData = z.infer<typeof g7HeroSchema>;

export const g7AboutSchema = z.object({ heading: text(240), body: text(1000) });
export type G7AboutData = z.infer<typeof g7AboutSchema>;

/** `categoryId` / `productId` / `brandId`: catalog reference picked in the Page Builder (links and counts
 * then come from the catalog; see resolve.ts). Empty = matched automatically by name. */
const ref = z.string().max(40).optional().default("");
const categoryItem = z.object({ title: text(80), image: media.nullable().default(null), url: text(300), categoryId: ref });
export const g7CategoriesSchema = z.object({
  heading: text(160),
  linkLabel: text(40),
  labelPosition: z.enum(["bottom-start", "bottom-end", "top-start", "top-end", "center"]).default("bottom-start"),
  items: z.array(categoryItem).max(8).default([]),
});
export type G7CategoriesData = z.infer<typeof g7CategoriesSchema>;
export type G7CategoryItem = z.infer<typeof categoryItem>;

const productTab = z.object({ key: z.string().max(40), label: text(60) });
const productItem = z.object({
  image: media.nullable().default(null),
  name: text(120),
  categoryLabel: text(80),
  weight: text(30),
  badge: text(30),
  /** Matches a tab key; empty = only shown under "All". */
  tab: text(40),
  url: text(300),
  productId: ref,
});
export const g7ProductsSchema = z.object({
  heading: text(160),
  allLabel: text(40),
  tabs: z.array(productTab).max(8).default([]),
  linkLabel: text(40),
  /** Shown when the selected filter has no products (empty = built-in localized text). */
  emptyMessage: text(200),
  items: z.array(productItem).max(24).default([]),
  cta: z
    .object({
      enabled: z.boolean().default(true),
      eyebrow: text(60),
      title: text(120),
      body: text(400),
      buttonLabel: text(60),
      buttonUrl: text(300),
    })
    .default({ enabled: true, eyebrow: "", title: "", body: "", buttonLabel: "", buttonUrl: "" }),
});
export type G7ProductsData = z.infer<typeof g7ProductsSchema>;
export type G7ProductItem = z.infer<typeof productItem>;
export type G7ProductTab = z.infer<typeof productTab>;

/** `count` is a manual fallback only -- with a catalog brand linked/matched the count is computed. */
const brandItem = z.object({ logo: media.nullable().default(null), name: text(80), count: text(40), url: text(300), brandId: ref });
export const g7BrandsSchema = z.object({ heading: text(160), items: z.array(brandItem).max(8).default([]) });
export type G7BrandsData = z.infer<typeof g7BrandsSchema>;
export type G7BrandItem = z.infer<typeof brandItem>;

export const g7BannerSchema = z.object({
  image: media.nullable().default(null),
  mobileImage: media.nullable().default(null),
  imageAlt: text(200),
  eyebrow: text(80),
  headingLine1: text(80),
  headingLine2: text(80),
  body: text(400),
  textX: textX("right"),
  textY: textY("center"),
  offsetX: nudge,
  offsetY: nudge,
});
export type G7BannerData = z.infer<typeof g7BannerSchema>;

const titledItem = z.object({ title: text(80), body: text(400) });
export const g7StepsSchema = z.object({ heading: text(160), subtitle: text(300), items: z.array(titledItem).max(6).default([]) });
export type G7StepsData = z.infer<typeof g7StepsSchema>;
export type G7TitledItem = z.infer<typeof titledItem>;

export const g7SectorsSchema = z.object({ eyebrow: text(80), heading: text(160), items: z.array(titledItem).max(6).default([]) });
export type G7SectorsData = z.infer<typeof g7SectorsSchema>;

const option = z.object({ value: z.string().max(80), label: text(80) });
export const g7QuoteSchema = z.object({
  anchorId: z.string().max(40).regex(/^[a-zA-Z0-9_-]*$/).optional().default("quote"),
  image: media.nullable().default(null),
  imageAlt: text(200),
  asideHeadingLine1: text(80),
  asideHeadingLine2: text(80),
  asideSubtitle: text(160),
  asideTextX: textX("center"),
  /** Split layout: the form on the inline end (default, as today) or start side; mirrors per language. */
  formSide: z.enum(["end", "start"]).optional().default("end"),
  asideTextY: textY("top"),
  asideOffsetX: nudge,
  asideOffsetY: nudge,
  eyebrow: text(60),
  heading: text(80),
  subtitle: text(160),
  nameLabel: text(40),
  namePlaceholder: text(60),
  companyLabel: text(40),
  companyPlaceholder: text(60),
  cityLabel: text(40),
  cityPlaceholder: text(60),
  /** Shown under the city select when the "other" option (value "other") is chosen. */
  otherCityLabel: text(60),
  phoneLabel: text(40),
  phonePlaceholder: text(60),
  productsLabel: text(40),
  quantityLabel: text(40),
  quantityPlaceholder: text(60),
  cities: z.array(option).max(30).default([]),
  products: z.array(option).max(12).default([]),
  quantities: z.array(option).max(12).default([]),
  submitLabel: text(60),
  note: text(160),
});
export type G7QuoteData = z.infer<typeof g7QuoteSchema>;
export type G7Option = z.infer<typeof option>;

/* -------------------------------------------------------------------------------------------------
 * Defaults (design copy)
 * -----------------------------------------------------------------------------------------------*/

const img = (name: string) => ({ id: `static:${name}`, url: `/images/home/${name}.webp` });

export const G7_DEFAULTS = {
  hero: {
    ar: {
      image: img("hero-products"),
      mobileImage: null,
      imageAlt: "عبوات جولدن سفن من البطاطس ولب المانجو والجوافة على منصة حجرية مع ثمار المانجو والجوافة وطبق بطاطس مقلية",
      eyebrow: "جولدن سفن",
      headingLine1: "مذاق يليـــق",
      headingLine2: "بضيافتــك.",
      primaryLabel: "اكتشف منتجاتنا",
      primaryUrl: "/products",
      secondaryLabel: "اطلب عرض سعر",
      secondaryUrl: "#quote",
      caption: "مذاقات طبيعية ... للحظات أجمل",
      textX: "right",
      textY: "center",
      offsetX: 0,
      offsetY: 0,
    },
    en: {
      image: img("hero-products"),
      mobileImage: null,
      imageAlt: "Golden Seven fries, mango pulp and guava pulp packs on a stone stand with fresh mango, guava and a plate of fries",
      eyebrow: "Golden Seven",
      headingLine1: "A taste worthy",
      headingLine2: "of your hospitality.",
      primaryLabel: "Explore our products",
      primaryUrl: "/products",
      secondaryLabel: "Request a quote",
      secondaryUrl: "#quote",
      caption: "Natural flavors... for better moments",
      textX: "right",
      textY: "center",
      offsetX: 0,
      offsetY: 0,
    },
  } satisfies Record<"ar" | "en", G7HeroData>,
  about: {
    ar: {
      heading: "شركة تجارة عامة قائمة على نشاط أساسي واحد: الغذاء",
      body: "جولدن سفن فودز شركة استيراد وتصدير بالجملة مقرها جدة. نوفّر المنتجات الغذائية للمطاعم والفنادق والمقاهي، مع خيارات توريد تناسب احتياجات أعمالك.",
    },
    en: {
      heading: "A general trading company built on one core activity: food",
      body: "Golden Seven Foods is a Jeddah-based wholesale import and export company. We supply food products to restaurants, hotels and cafés, with supply options that fit your business needs.",
    },
  } satisfies Record<"ar" | "en", G7AboutData>,
  categories: {
    ar: {
      heading: "منتجاتنا، اختيارك الذهبي.",
      linkLabel: "تسوق الآن",
      labelPosition: "bottom-start",
      items: [
        { title: "لحوم مجمدة", image: img("category-frozen-meat"), url: "/products", categoryId: "" },
        { title: "خضروات مجمدة", image: img("category-frozen-vegetables"), url: "/products", categoryId: "" },
        { title: "فواكه مجمدة", image: img("category-frozen-fruits"), url: "/products", categoryId: "" },
        { title: "بطاطس مجمدة", image: img("category-frozen-potatoes"), url: "/products", categoryId: "" },
      ],
    },
    en: {
      heading: "Our products, your golden choice.",
      linkLabel: "Shop now",
      labelPosition: "bottom-start",
      items: [
        { title: "Frozen meat", image: img("category-frozen-meat"), url: "/products", categoryId: "" },
        { title: "Frozen vegetables", image: img("category-frozen-vegetables"), url: "/products", categoryId: "" },
        { title: "Frozen fruits", image: img("category-frozen-fruits"), url: "/products", categoryId: "" },
        { title: "Frozen potatoes", image: img("category-frozen-potatoes"), url: "/products", categoryId: "" },
      ],
    },
  } satisfies Record<"ar" | "en", G7CategoriesData>,
  products: {
    ar: {
      heading: "منتجات مختارة",
      allLabel: "الكل",
      tabs: [
        { key: "potatoes", label: "البطاطس" },
        { key: "pulp", label: "لب الفاكهة" },
        { key: "meat", label: "اللحوم المجمدة" },
      ],
      linkLabel: "عرض المنتج",
      emptyMessage: "لا توجد منتجات في هذه الفئة حاليًا — اطلب عرض سعر وسنوفرها لك",
      items: [
        { image: img("product-white-guava-pulp-1kg"), name: "لب الجوافة البيضاء جولدن سفن", categoryLabel: "لب فواكه مجمد", weight: "١ كجم", badge: "مجمد", tab: "pulp", url: "/products", productId: "" },
        { image: img("product-totapuri-mango-pulp-1kg"), name: "لب مانجو توتابوري جولدن سفن", categoryLabel: "لب فواكه مجمد", weight: "١ كجم", badge: "مجمد", tab: "pulp", url: "/products", productId: "" },
        { image: img("product-golden-seven-fries-2.5kg"), name: "بطاطس جولدن سفن", categoryLabel: "بطاطس مجمدة", weight: "٢٫٥ كجم", badge: "مجمد", tab: "potatoes", url: "/products", productId: "" },
        { image: img("product-absher-fries-10mm"), name: "أبشر بالبطاطس — ١٠ مم", categoryLabel: "بطاطس مجمدة", weight: "٢٫٥ كجم", badge: "مجمد", tab: "potatoes", url: "/products", productId: "" },
        { image: img("product-absher-fries-7mm"), name: "أبشر بالبطاطس — ٧ مم", categoryLabel: "بطاطس مجمدة", weight: "٢٫٥ كجم", badge: "مجمد", tab: "potatoes", url: "/products", productId: "" },
      ],
      cta: {
        enabled: true,
        eyebrow: "لأعمالك",
        title: "اختيارات تناسب قائمتك.",
        body: "شاركنا احتياجك من المنتجات والكميات، ودعنا نجهّز لك عرض توريد مناسبًا.",
        buttonLabel: "اطلب عرض سعر",
        buttonUrl: "#quote",
      },
    },
    en: {
      heading: "Featured products",
      allLabel: "All",
      tabs: [
        { key: "potatoes", label: "Potatoes" },
        { key: "pulp", label: "Fruit pulp" },
        { key: "meat", label: "Frozen meat" },
      ],
      linkLabel: "View product",
      emptyMessage: "No products in this category yet — request a quote and we'll source it for you",
      items: [
        { image: img("product-white-guava-pulp-1kg"), name: "Golden Seven White Guava Pulp", categoryLabel: "Frozen fruit pulp", weight: "1 kg", badge: "Frozen", tab: "pulp", url: "/products", productId: "" },
        { image: img("product-totapuri-mango-pulp-1kg"), name: "Golden Seven Totapuri Mango Pulp", categoryLabel: "Frozen fruit pulp", weight: "1 kg", badge: "Frozen", tab: "pulp", url: "/products", productId: "" },
        { image: img("product-golden-seven-fries-2.5kg"), name: "Golden Seven Fries", categoryLabel: "Frozen potatoes", weight: "2.5 kg", badge: "Frozen", tab: "potatoes", url: "/products", productId: "" },
        { image: img("product-absher-fries-10mm"), name: "Absher Fries — 10 mm", categoryLabel: "Frozen potatoes", weight: "2.5 kg", badge: "Frozen", tab: "potatoes", url: "/products", productId: "" },
        { image: img("product-absher-fries-7mm"), name: "Absher Fries — 7 mm", categoryLabel: "Frozen potatoes", weight: "2.5 kg", badge: "Frozen", tab: "potatoes", url: "/products", productId: "" },
      ],
      cta: {
        enabled: true,
        eyebrow: "For your business",
        title: "Choices that fit your menu.",
        body: "Tell us which products and quantities you need, and let us prepare a supply offer that suits you.",
        buttonLabel: "Request a quote",
        buttonUrl: "#quote",
      },
    },
  } satisfies Record<"ar" | "en", G7ProductsData>,
  brands: {
    ar: {
      heading: "علامات نعمل معها",
      items: [
        { logo: img("brand-golden-seven-logo"), name: "جولدن سفن", count: "٨ منتجات", url: "/brands", brandId: "" },
        { logo: img("brand-absher-logo"), name: "أبشر بالبطاطس", count: "منتج واحد", url: "/brands", brandId: "" },
      ],
    },
    en: {
      heading: "Brands we work with",
      items: [
        { logo: img("brand-golden-seven-logo"), name: "Golden Seven", count: "8 products", url: "/brands", brandId: "" },
        { logo: img("brand-absher-logo"), name: "Absher Fries", count: "1 product", url: "/brands", brandId: "" },
      ],
    },
  } satisfies Record<"ar" | "en", G7BrandsData>,
  banner: {
    ar: {
      image: img("lifestyle-hospitality-banner"),
      mobileImage: null,
      imageAlt: "طاولة مطعم عليها عصير مانجو وبطاطس مقلية وجوافة طازجة",
      eyebrow: "من منتجاتنا إلى مائدتك",
      headingLine1: "تفاصيل صغيرة.",
      headingLine2: "ضيافة لا تُنسى.",
      body: "قرمشة ذهبية ومذاقات فاكهة طبيعية، لتجربة تستحق أن تُشارك.",
      textX: "right",
      textY: "center",
      offsetX: 0,
      offsetY: 0,
    },
    en: {
      image: img("lifestyle-hospitality-banner"),
      mobileImage: null,
      imageAlt: "A restaurant table with mango juice, golden fries and fresh guava",
      eyebrow: "From our products to your table",
      headingLine1: "Small details.",
      headingLine2: "Unforgettable hospitality.",
      body: "Golden crunch and natural fruit flavors, for an experience worth sharing.",
      textX: "right",
      textY: "center",
      offsetX: 0,
      offsetY: 0,
    },
  } satisfies Record<"ar" | "en", G7BannerData>,
  steps: {
    ar: {
      heading: "نعتني بما وراء المذاق.",
      subtitle: "من اختيار التشكيلة إلى ترتيب التوريد، نبدأ باحتياج أعمالك.",
      items: [
        { title: "تشكيلة تناسبك", body: "بطاطس ولب فواكه، وخيارات تساعدك على بناء قائمة تناسب ذائقة ضيوفك." },
        { title: "اختيارات عملية", body: "عبوات وأحجام واضحة، لتختار المنتج المناسب لطبيعة مطبخك." },
        { title: "توريد لأعمالك", body: "شاركنا مدينتك والكميات المطلوبة، لنناقش تفاصيل التوريد مع فريقك." },
      ],
    },
    en: {
      heading: "We care about what's behind the taste.",
      subtitle: "From choosing the range to arranging supply, we start with your business needs.",
      items: [
        { title: "A range that suits you", body: "Fries and fruit pulp, with options that help you build a menu your guests will love." },
        { title: "Practical choices", body: "Clear packs and sizes, so you can pick the right product for your kitchen." },
        { title: "Supply for your business", body: "Share your city and the quantities you need, and we'll discuss the supply details with your team." },
      ],
    },
  } satisfies Record<"ar" | "en", G7StepsData>,
  sectors: {
    ar: {
      eyebrow: "لقطاع الأعمال",
      heading: "شريك لمطبخك، مهما كان حجمه.",
      items: [
        { title: "المطاعم", body: "خيارات تكمّل أطباقك وتنوّع قائمتك." },
        { title: "الفنادق والضيافة", body: "مذاقات تناسب البوفيه وتفاصيل تجربة الضيف." },
        { title: "المقاهي والعصائر", body: "لب مانجو وجوافة لإبداعات مشروباتك." },
      ],
    },
    en: {
      eyebrow: "For businesses",
      heading: "A partner for your kitchen, whatever its size.",
      items: [
        { title: "Restaurants", body: "Options that complement your dishes and diversify your menu." },
        { title: "Hotels & hospitality", body: "Flavors suited to buffets and every detail of the guest experience." },
        { title: "Cafés & juice bars", body: "Mango and guava pulp for your drink creations." },
      ],
    },
  } satisfies Record<"ar" | "en", G7SectorsData>,
  quote: {
    ar: {
      anchorId: "quote",
      image: img("cta-quote-products"),
      imageAlt: "عبوات بطاطس جولدن سفن ولب المانجو والجوافة مع ثمار طازجة",
      asideHeadingLine1: "خلّنا نبدأ",
      asideHeadingLine2: "شراكة بطعم مميز.",
      asideSubtitle: "منتجات طبيعية بجودة تثق بها",
      asideTextX: "center",
      formSide: "end",
      asideTextY: "top",
      asideOffsetX: 0,
      asideOffsetY: 0,
      eyebrow: "طلب عرض سعر",
      heading: "ننمو معًا",
      subtitle: "أخبرنا باحتياجك لنبدأ شراكة مميزة",
      nameLabel: "الاسم",
      namePlaceholder: "اكتب اسمك",
      companyLabel: "اسم المنشأة",
      companyPlaceholder: "اسم المنشأة",
      cityLabel: "المدينة",
      cityPlaceholder: "اختر المدينة",
      otherCityLabel: "اكتب اسم المدينة",
      phoneLabel: "رقم التواصل",
      phonePlaceholder: "أدخل رقم التواصل",
      productsLabel: "المنتجات المطلوبة",
      quantityLabel: "الكمية التقريبية",
      quantityPlaceholder: "اختر الكمية التقريبية",
      cities: [
        { value: "jeddah", label: "جدة" },
        { value: "riyadh", label: "الرياض" },
        { value: "makkah", label: "مكة المكرمة" },
        { value: "madinah", label: "المدينة المنورة" },
        { value: "dammam", label: "الدمام" },
        { value: "khobar", label: "الخبر" },
        { value: "taif", label: "الطائف" },
        { value: "other", label: "مدينة أخرى" },
      ],
      products: [
        { value: "fries", label: "بطاطس" },
        { value: "mango", label: "مانجو" },
        { value: "guava", label: "جوافة" },
      ],
      quantities: [
        { value: "lt-100kg", label: "أقل من ١٠٠ كجم" },
        { value: "100-500kg", label: "١٠٠ – ٥٠٠ كجم" },
        { value: "500kg-1t", label: "٥٠٠ كجم – ١ طن" },
        { value: "gt-1t", label: "أكثر من ١ طن" },
      ],
      submitLabel: "اطلب عرض سعر",
      note: "سنتواصل معك قريبًا لمناقشة التفاصيل.",
    },
    en: {
      anchorId: "quote",
      image: img("cta-quote-products"),
      imageAlt: "Golden Seven fries, mango pulp and guava pulp packs with fresh fruit",
      asideHeadingLine1: "Let's begin",
      asideHeadingLine2: "a partnership worth savoring.",
      asideSubtitle: "Natural products, quality you can trust",
      asideTextX: "center",
      formSide: "end",
      asideTextY: "top",
      asideOffsetX: 0,
      asideOffsetY: 0,
      eyebrow: "Request a quote",
      heading: "Let's grow together",
      subtitle: "Tell us what you need to start a great partnership",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      companyLabel: "Business name",
      companyPlaceholder: "Business name",
      cityLabel: "City",
      cityPlaceholder: "Select a city",
      otherCityLabel: "Enter the city name",
      phoneLabel: "Phone number",
      phonePlaceholder: "Enter your phone number",
      productsLabel: "Products needed",
      quantityLabel: "Approximate quantity",
      quantityPlaceholder: "Select an approximate quantity",
      cities: [
        { value: "jeddah", label: "Jeddah" },
        { value: "riyadh", label: "Riyadh" },
        { value: "makkah", label: "Makkah" },
        { value: "madinah", label: "Madinah" },
        { value: "dammam", label: "Dammam" },
        { value: "khobar", label: "Al Khobar" },
        { value: "taif", label: "Taif" },
        { value: "other", label: "Other city" },
      ],
      products: [
        { value: "fries", label: "Fries" },
        { value: "mango", label: "Mango" },
        { value: "guava", label: "Guava" },
      ],
      quantities: [
        { value: "lt-100kg", label: "Under 100 kg" },
        { value: "100-500kg", label: "100 – 500 kg" },
        { value: "500kg-1t", label: "500 kg – 1 ton" },
        { value: "gt-1t", label: "Over 1 ton" },
      ],
      submitLabel: "Request a quote",
      note: "We'll contact you soon to discuss the details.",
    },
  } satisfies Record<"ar" | "en", G7QuoteData>,
};
