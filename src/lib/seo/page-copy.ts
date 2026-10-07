import { normalizeBrandSpelling } from "@/lib/brand";

/**
 * Golden Seven search copy: the <title> / meta description each public page uses when its CMS SEO
 * record (Admin -> the entity -> SEO) leaves the field empty. buildMetadata applies it only on the
 * Golden Seven domain. Titles stay under ~60 characters, descriptions ~140-160.
 */
export interface SeoCopy {
  title: string;
  description: string;
}

type Localized = { ar: SeoCopy; en: SeoCopy };

export const SITE_DEFAULT_COPY: Localized = {
  ar: {
    title: "جولدن سفن فودز | توريد أغذية مجمدة بالجملة في جدة والسعودية",
    description:
      "جولدن سفن فودز، مورد جملة في جدة للبطاطس المجمدة ولب المانجو والجوافة والخضروات واللحوم المجمدة للمطاعم والفنادق والمقاهي. اطلب عرض سعر.",
  },
  en: {
    title: "Golden Seven Foods | Wholesale Frozen Food Supply in Jeddah",
    description:
      "Golden Seven Foods: Jeddah wholesale supplier of frozen fries, mango and guava pulp, vegetables and frozen meat for restaurants, hotels and cafés. Get a quote.",
  },
};

const PAGE_COPY = {
  home: SITE_DEFAULT_COPY,
  products: {
    ar: {
      title: "منتجات أغذية مجمدة بالجملة | جولدن سفن",
      description:
        "تصفح منتجات جولدن سفن المجمدة بالجملة: بطاطس مجمدة، لب مانجو وجوافة، خضروات مشكلة وبازلاء، ولحوم مجمدة للمطاعم والفنادق في جدة والسعودية.",
    },
    en: {
      title: "Wholesale Frozen Food Products | Golden Seven",
      description:
        "Golden Seven's wholesale frozen range: French fries, mango and guava pulp, mixed vegetables, green peas and frozen meat for restaurants and hotels in Saudi Arabia.",
    },
  },
  about: {
    ar: {
      title: "من نحن | جولدن سفن فودز لتوريد الأغذية المجمدة",
      description:
        "تعرّف على جولدن سفن فودز، شركة توريد أغذية مجمدة بالجملة في جدة تخدم المطاعم والفنادق وشركات التموين في السعودية بمنتجات موثوقة وتوريد منتظم.",
    },
    en: {
      title: "About Golden Seven Foods | Frozen Food Supplier, Jeddah",
      description:
        "Golden Seven Foods is a Jeddah-based wholesale frozen food supplier serving restaurants, hotels and caterers across Saudi Arabia with reliable, steady supply.",
    },
  },
  solutions: {
    ar: {
      title: "حلول توريد الأغذية حسب القطاع | جولدن سفن",
      description:
        "حلول توريد أغذية مجمدة بالجملة مصممة للفنادق والمطاعم وشركات التموين والمستشفيات وتجارة الجملة والتجزئة في جدة والسعودية. اطلب عرض سعر.",
    },
    en: {
      title: "Food Supply Solutions by Sector | Golden Seven",
      description:
        "Wholesale frozen food supply built for hotels, restaurants, caterers, hospitals, wholesalers and retailers in Jeddah and across Saudi Arabia. Request a quote.",
    },
  },
  brands: {
    ar: {
      title: "العلامات التجارية للأغذية المجمدة | جولدن سفن",
      description:
        "العلامات التجارية التي توزعها جولدن سفن فودز في السعودية، ومنها جولدن سفن وأبشر: بطاطس مجمدة ولب فواكه وخضروات ولحوم مجمدة بالجملة للمطاعم والفنادق.",
    },
    en: {
      title: "Frozen Food Brands We Distribute | Golden Seven",
      description:
        "The brands Golden Seven Foods distributes in Saudi Arabia, including Golden Seven and Absher: frozen fries, fruit pulp, vegetables and meat for food service.",
    },
  },
  contact: {
    ar: {
      title: "تواصل معنا واطلب عرض سعر | جولدن سفن",
      description:
        "تواصل مع جولدن سفن فودز في جدة واطلب عرض سعر لتوريد البطاطس المجمدة ولب الفواكه والخضروات واللحوم المجمدة لمطعمك أو فندقك أو مقهاك.",
    },
    en: {
      title: "Contact Us & Request a Quote | Golden Seven Foods",
      description:
        "Contact Golden Seven Foods in Jeddah and request a quote for wholesale frozen fries, fruit pulp, vegetables and frozen meat for your restaurant, hotel or café.",
    },
  },
  faq: {
    ar: {
      title: "الأسئلة الشائعة عن التوريد بالجملة | جولدن سفن",
      description:
        "إجابات عن الأسئلة الشائعة حول طلب الأغذية المجمدة بالجملة من جولدن سفن فودز: المنتجات وعروض الأسعار والتوريد في جدة والسعودية.",
    },
    en: {
      title: "FAQ: Wholesale Frozen Food Supply | Golden Seven",
      description:
        "Answers to common questions about ordering wholesale frozen food from Golden Seven Foods: products, quotes and supply in Jeddah and Saudi Arabia.",
    },
  },
  blog: {
    ar: {
      title: "مدونة جولدن سفن | الأغذية المجمدة للمطاعم",
      description:
        "مقالات ونصائح من جولدن سفن فودز حول الأغذية المجمدة وتخزينها وتوريدها بالجملة للمطاعم والفنادق والمقاهي في السعودية.",
    },
    en: {
      title: "Golden Seven Blog | Frozen Food for Food Service",
      description:
        "Articles and tips from Golden Seven Foods on frozen food, storage and wholesale sourcing for restaurants, hotels and cafés in Saudi Arabia.",
    },
  },
  "quality-food-safety": {
    ar: {
      title: "الجودة وسلامة الغذاء | جولدن سفن فودز",
      description:
        "كيف تحافظ جولدن سفن فودز على جودة وسلامة الأغذية المجمدة من التوريد حتى التسليم، وفق المعايير التي يتطلبها كل منتج للمطاعم والفنادق في السعودية.",
    },
    en: {
      title: "Quality & Food Safety | Golden Seven Foods",
      description:
        "How Golden Seven Foods protects the quality and safety of frozen food from sourcing to delivery, handled to the standard each product requires for food service.",
    },
  },
  "distribution-logistics": {
    ar: {
      title: "التوزيع والخدمات اللوجستية | جولدن سفن فودز",
      description:
        "التوزيع والخدمات اللوجستية لدى جولدن سفن فودز: من التوريد حتى رصيف التحميل لديك، توريد أغذية مجمدة بالجملة للمطاعم والفنادق في جدة والسعودية.",
    },
    en: {
      title: "Distribution & Logistics | Golden Seven Foods",
      description:
        "Golden Seven Foods distribution and logistics: from sourcing to your loading dock, wholesale frozen food supply for restaurants and hotels in Jeddah and KSA.",
    },
  },
  privacy: {
    ar: {
      title: "سياسة الخصوصية | جولدن سفن فودز",
      description: "سياسة الخصوصية لموقع جولدن سفن فودز: كيف نجمع بياناتك ونستخدمها ونحميها عند تصفح الموقع أو طلب عرض سعر.",
    },
    en: {
      title: "Privacy Policy | Golden Seven Foods",
      description: "Golden Seven Foods privacy policy: how we collect, use and protect your data when you browse the site or request a quote.",
    },
  },
  terms: {
    ar: {
      title: "شروط الخدمة | جولدن سفن فودز",
      description: "شروط استخدام موقع جولدن سفن فودز وطلب عروض الأسعار لتوريد الأغذية المجمدة بالجملة.",
    },
    en: {
      title: "Terms of Service | Golden Seven Foods",
      description: "The terms that apply to using the Golden Seven Foods website and requesting quotes for wholesale frozen food supply.",
    },
  },
  cookies: {
    ar: {
      title: "سياسة ملفات تعريف الارتباط | جولدن سفن",
      description: "كيف يستخدم موقع جولدن سفن فودز ملفات تعريف الارتباط، وكيف يمكنك التحكم بها من إعدادات متصفحك.",
    },
    en: {
      title: "Cookie Policy | Golden Seven Foods",
      description: "How the Golden Seven Foods website uses cookies and how you can control them from your browser settings.",
    },
  },
} satisfies Record<string, Localized>;

export type PageCopyKey = keyof typeof PAGE_COPY;

const pick = (copy: Localized, locale: string): SeoCopy => (locale === "ar" ? copy.ar : copy.en);

export function pageCopy(key: PageCopyKey, locale: string): SeoCopy {
  return pick(PAGE_COPY[key], locale);
}

const SOLUTION_COPY: Record<string, Localized> = {
  hotels: {
    ar: {
      title: "توريد أغذية مجمدة للفنادق في جدة | جولدن سفن",
      description:
        "توريد أغذية مجمدة بالجملة للفنادق في جدة والسعودية: بطاطس ولب فواكه وخضروات ولحوم مجمدة بإمداد ثابت لكل منافذ الأغذية والمشروبات. اطلب عرض سعر.",
    },
    en: {
      title: "Frozen Food Supply for Hotels in Jeddah | Golden Seven",
      description:
        "Wholesale frozen food for hotels in Jeddah and Saudi Arabia: fries, fruit pulp, vegetables and frozen meat, with steady supply for every F&B outlet.",
    },
  },
  restaurants: {
    ar: {
      title: "توريد أغذية مجمدة للمطاعم في جدة | جولدن سفن",
      description:
        "مورد جملة للمطاعم في جدة: بطاطس مجمدة وخضروات ولب فواكه ولحوم مجمدة بتوريد ثابت يحافظ على طعم أطباقكم في كل مرة. اطلب عرض سعر من جولدن سفن.",
    },
    en: {
      title: "Frozen Food Supplier for Restaurants | Golden Seven",
      description:
        "Wholesale frozen fries, vegetables, fruit pulp and meat for restaurants in Jeddah and Saudi Arabia, with consistent supply that keeps every dish on the menu.",
    },
  },
  catering: {
    ar: {
      title: "توريد أغذية مجمدة لشركات التموين | جولدن سفن",
      description:
        "توريد أغذية مجمدة بالجملة لشركات التموين في جدة والسعودية، بأحجام ومواعيد تناسب جداول الفعاليات: بطاطس وخضروات ولب فواكه ولحوم. اطلب عرض سعر.",
    },
    en: {
      title: "Frozen Food Supply for Catering Companies | Golden Seven",
      description:
        "Wholesale frozen food for catering companies in Saudi Arabia, with volumes and delivery timing built around event schedules: fries, vegetables, pulp and meat.",
    },
  },
  hospitals: {
    ar: {
      title: "توريد أغذية مجمدة للمستشفيات | جولدن سفن",
      description:
        "إمداد موثوق بالأغذية المجمدة لتموين المرضى والموظفين في المستشفيات بجدة والسعودية: خضروات وبطاطس ولب فواكه ولحوم مجمدة. اطلب عرض سعر.",
    },
    en: {
      title: "Frozen Food Supply for Hospitals | Golden Seven",
      description:
        "Dependable wholesale frozen food for hospital patient and staff catering in Jeddah and Saudi Arabia: vegetables, fries, fruit pulp and frozen meat. Request a quote.",
    },
  },
  wholesale: {
    ar: {
      title: "أغذية مجمدة لتجار الجملة والموزعين | جولدن سفن",
      description:
        "توريد بكامل كتالوج جولدن سفن لتجار الجملة والموزعين في السعودية لإعادة التوزيع والبيع: بطاطس ولب فواكه وخضروات ولحوم مجمدة. اطلب عرض سعر.",
    },
    en: {
      title: "Frozen Food for Wholesalers & Distributors | Golden Seven",
      description:
        "Full-catalog frozen food supply for wholesalers and distributors in Saudi Arabia: French fries, fruit pulp, vegetables and frozen meat for onward sale. Get a quote.",
    },
  },
  retail: {
    ar: {
      title: "أغذية مجمدة لمنافذ التجزئة | جولدن سفن",
      description:
        "منتجات أغذية مجمدة لمنافذ بيع الأغذية بالتجزئة في جدة والسعودية: بطاطس مجمدة ولب مانجو وجوافة وخضروات ولحوم من جولدن سفن. اطلب عرض سعر.",
    },
    en: {
      title: "Frozen Food Supply for Retailers | Golden Seven",
      description:
        "Frozen food products for retail food outlets in Jeddah and Saudi Arabia: French fries, mango and guava pulp, vegetables and frozen meat from Golden Seven.",
    },
  },
  "food-service": {
    ar: {
      title: "توريد أغذية مجمدة لقطاع الخدمات الغذائية | جولدن سفن",
      description:
        "مورد جملة واحد لمشغلي قطاع الخدمات الغذائية والمقاهي في السعودية عبر أصناف متعددة: بطاطس مجمدة ولب فواكه وخضروات ولحوم مجمدة. اطلب عرض سعر.",
    },
    en: {
      title: "Frozen Food Supply for Food Service | Golden Seven",
      description:
        "One wholesale supplier for food service operators and cafés in Saudi Arabia across several categories: fries, fruit pulp, vegetables and frozen meat. Get a quote.",
    },
  },
};

/** A solution (sector) page; unknown slugs get a generated line from the sector name. */
export function solutionCopy(slug: string, locale: string, name: string): SeoCopy {
  const known = SOLUTION_COPY[slug];
  if (known) return pick(known, locale);
  return locale === "ar"
    ? {
        title: `توريد أغذية مجمدة لقطاع ${name} | جولدن سفن`,
        description: `توريد أغذية مجمدة بالجملة لقطاع ${name} في جدة والسعودية: بطاطس ولب فواكه وخضروات ولحوم مجمدة من جولدن سفن فودز. اطلب عرض سعر.`,
      }
    : {
        title: `Frozen Food Supply for ${name} | Golden Seven`,
        description: `Wholesale frozen food for ${name.toLowerCase()} in Jeddah and Saudi Arabia: fries, fruit pulp, vegetables and frozen meat from Golden Seven Foods. Get a quote.`,
      };
}

const BRAND_COPY: Record<string, Localized> = {
  "golden-seven": {
    ar: {
      title: "منتجات جولدن سفن المجمدة بالجملة في جدة",
      description:
        "منتجات علامة جولدن سفن المجمدة: بطاطس مجمدة، بازلاء وخضار مشكل، لب مانجو ولب جوافة، ولحوم مجمدة بالجملة للمطاعم والفنادق في السعودية.",
    },
    en: {
      title: "Golden Seven Frozen Food Products | Wholesale",
      description:
        "Golden Seven frozen products: French fries, green peas and mixed vegetables, mango and guava pulp, and frozen meat, wholesale for restaurants and hotels in KSA.",
    },
  },
  absher: {
    ar: {
      title: "بطاطس أبشر المجمدة بالجملة | جولدن سفن",
      description:
        "بطاطس أبشر المجمدة يوفرها جولدن سفن فودز بالجملة للمطاعم والفنادق والمقاهي في جدة والسعودية، بمقاسات قطع متعددة. اطلب عرض سعر.",
    },
    en: {
      title: "Absher Frozen French Fries Wholesale | Golden Seven",
      description:
        "Absher frozen French fries in several cut sizes, supplied wholesale by Golden Seven Foods to restaurants, hotels and cafés in Jeddah and Saudi Arabia. Get a quote.",
    },
  },
};

export function brandCopy(slug: string, locale: string, name: string): SeoCopy {
  const known = BRAND_COPY[slug];
  if (known) return pick(known, locale);
  return locale === "ar"
    ? {
        title: `منتجات ${name} بالجملة | جولدن سفن`,
        description: `منتجات ${name} يوفرها جولدن سفن فودز بالجملة للمطاعم والفنادق والمقاهي في جدة والسعودية. تصفح المنتجات واطلب عرض سعر.`,
      }
    : {
        title: `${name} Products Wholesale | Golden Seven`,
        description: `${name} products supplied wholesale by Golden Seven Foods to restaurants, hotels and cafés in Jeddah and Saudi Arabia. Browse the range and get a quote.`,
      };
}

/** Category listings (/products?category=<slug>). Both spellings of the fries slug are covered. */
const CATEGORY_COPY: Record<string, Localized> = {
  "french-fries": {
    ar: {
      title: "بطاطس مجمدة بالجملة للمطاعم | جولدن سفن",
      description:
        "بطاطس مجمدة بالجملة من جولدن سفن وأبشر للمطاعم والفنادق والمقاهي في جدة والسعودية، بمقاسات قطع متعددة. اطلب عرض سعر.",
    },
    en: {
      title: "Wholesale Frozen French Fries | Golden Seven",
      description:
        "Wholesale frozen French fries from Golden Seven and Absher for restaurants, hotels and cafés in Jeddah and Saudi Arabia, in several cut sizes. Request a quote.",
    },
  },
  "frozen-vegetables": {
    ar: {
      title: "خضروات مجمدة بالجملة | جولدن سفن",
      description:
        "خضروات مجمدة بالجملة من جولدن سفن: بازلاء خضراء، بازلاء مع الجزر، خضار مشكل ومع الذرة الحلوة للمطاعم والفنادق في السعودية. اطلب عرض سعر.",
    },
    en: {
      title: "Wholesale Frozen Vegetables | Golden Seven",
      description:
        "Wholesale frozen vegetables from Golden Seven: green peas, peas and carrots, mixed vegetables and mixed vegetables with sweet corn for food service in Saudi Arabia.",
    },
  },
  "frozen-fruits": {
    ar: {
      title: "لب مانجو وجوافة مجمد بالجملة | جولدن سفن",
      description:
        "فواكه مجمدة بالجملة من جولدن سفن: لب مانجو ولب جوافة للمطاعم والمقاهي ومحلات العصائر في جدة والسعودية. اطلب عرض سعر.",
    },
    en: {
      title: "Frozen Mango & Guava Pulp Wholesale | Golden Seven",
      description:
        "Wholesale frozen fruit from Golden Seven: mango pulp and guava pulp for restaurants, cafés and juice bars in Jeddah and Saudi Arabia. Request a quote.",
    },
  },
  "frozen-meat": {
    ar: {
      title: "لحوم مجمدة بالجملة للمطاعم | جولدن سفن",
      description:
        "لحوم مجمدة بالجملة من جولدن سفن للمطاعم والفنادق وشركات التموين في جدة والسعودية. اطلب عرض سعر للكميات التي تحتاجها.",
    },
    en: {
      title: "Wholesale Frozen Meat | Golden Seven",
      description:
        "Wholesale frozen meat from Golden Seven for restaurants, hotels and catering companies in Jeddah and Saudi Arabia. Request a quote for your volumes.",
    },
  },
};
CATEGORY_COPY["frensh-fries"] = CATEGORY_COPY["french-fries"];

export function categoryCopy(slug: string, locale: string, name: string): SeoCopy {
  const known = CATEGORY_COPY[slug];
  if (known) return pick(known, locale);
  return locale === "ar"
    ? {
        title: `${name} بالجملة | جولدن سفن`,
        description: `${name} بالجملة من جولدن سفن فودز للمطاعم والفنادق والمقاهي في جدة والسعودية. تصفح المنتجات واطلب عرض سعر.`,
      }
    : {
        title: `Wholesale ${name} | Golden Seven`,
        description: `Wholesale ${name.toLowerCase()} from Golden Seven Foods for restaurants, hotels and cafés in Jeddah and Saudi Arabia. Browse the range and get a quote.`,
      };
}

const tidy = (text: string) => normalizeBrandSpelling(text).replace(/\s+/g, " ").trim();
const mentionsBrand = (text: string) => /جولدن سفن|golden seven/i.test(text);

const STORAGE: Record<string, { ar: string; en: string }> = {
  FROZEN: { ar: "يُحفظ مجمدًا", en: "stored frozen" },
  CHILLED: { ar: "يُحفظ مبردًا", en: "stored chilled" },
  AMBIENT: { ar: "يُحفظ في درجة حرارة الغرفة", en: "stored at room temperature" },
};

export interface ProductCopyInput {
  name: string;
  /** One pack weight shared by the product (or all of its variants); null when unknown or mixed. */
  weight: string | null;
  categoryName: string | null;
  brandName: string | null;
  temperatureClass: string;
}

/**
 * Product page copy from catalog data only (nothing invented):
 *   AR "<name> <weight> للمطاعم والفنادق | جولدن سفن", EN "<name> <weight> for Restaurants & Hotels | Golden Seven".
 * The brand suffix is dropped when the product name already carries it, and the audience phrase is
 * dropped when the title would run past ~60 characters.
 */
export function productCopy(input: ProductCopyInput, locale: string): SeoCopy {
  const isAr = locale === "ar";
  const name = tidy(input.name);
  const weight = input.weight ? tidy(input.weight) : null;
  // "<brand>" is skipped in the sentence when the product name already carries it.
  const brand = input.brandName && !name.includes(tidy(input.brandName)) ? tidy(input.brandName) : null;
  const category = input.categoryName ? tidy(input.categoryName) : null;
  const base = weight ? `${name} ${weight}` : name;

  const suffix = mentionsBrand(name) ? "" : isAr ? " | جولدن سفن" : " | Golden Seven";
  const audience = isAr ? " للمطاعم والفنادق" : " for Restaurants & Hotels";
  const full = `${base}${audience}${suffix}`;
  const title = full.length <= 62 ? full : `${base}${suffix}`;

  const storage = STORAGE[input.temperatureClass] ?? null;
  // Longest variant first; optional clauses are dropped until it fits ~160 characters.
  const build = (withCategory: boolean, withStorage: boolean, withCta: boolean) =>
    isAr
      ? `${name}${weight ? ` بعبوة ${weight}` : ""}${brand ? ` من علامة ${brand}` : ""}${withCategory && category ? ` ضمن فئة ${category}` : ""}` +
        `${withStorage && storage ? `، ${storage.ar}` : ""}. توريد بالجملة من جولدن سفن فودز للمطاعم والفنادق والمقاهي في جدة والسعودية.${withCta ? " اطلب عرض سعر." : ""}`
      : `${name}${weight ? `, ${weight} pack` : ""}${brand ? ` by ${brand}` : ""}${withCategory && category ? ` in ${category.toLowerCase()}` : ""}` +
        `${withStorage && storage ? `, ${storage.en}` : ""}. Wholesale from Golden Seven Foods for restaurants, hotels and cafés in Saudi Arabia.${withCta ? " Get a quote." : ""}`;
  const candidates = [build(true, true, true), build(true, true, false), build(false, true, false), build(false, false, false)];
  const description = candidates.find((c) => c.length <= 160) ?? candidates[candidates.length - 1];
  return { title, description };
}
