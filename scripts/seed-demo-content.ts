/**
 * Populates realistic-but-generic demo catalog/content data: categories (with
 * subcategories), brands, products, blog posts, and FAQs. Rerunnable --
 * upserts by slug/sku, never duplicates. Deliberately seeds ZERO
 * certifications (see HANDOFF.md) and invents no awards, partnerships,
 * revenue figures, customer counts, or geographic/official company claims --
 * only generic product attributes (weight, packaging, typical nutrition
 * facts for the food type) and placeholder editorial copy.
 *
 * Run: npx tsx scripts/seed-demo-content.ts
 */
import { prisma } from "../src/lib/prisma";

interface CategorySeed {
  slug: string;
  icon?: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  children?: CategorySeed[];
}

interface ProductSeed {
  sku: string;
  slug: string;
  categorySlug: string;
  brandSlug?: string;
  temperatureClass: "FROZEN" | "CHILLED" | "AMBIENT";
  originCountry?: string;
  weight?: string;
  dimensions?: string;
  isFeatured?: boolean;
  nameEn: string;
  nameAr: string;
  shortDescriptionEn: string;
  shortDescriptionAr: string;
  descriptionEn: string;
  descriptionAr: string;
  packagingEn: string;
  packagingAr: string;
  storageEn: string;
  storageAr: string;
  ingredientsEn?: string;
  ingredientsAr?: string;
  nutritionInfoEn?: string;
  nutritionInfoAr?: string;
  allergensEn?: string;
  allergensAr?: string;
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: "frozen-poultry",
    icon: "🐔",
    nameEn: "Frozen Poultry",
    nameAr: "دواجن مجمدة",
    descriptionEn: "Whole birds, cuts, and processed poultry held at a consistent frozen temperature from receiving to delivery.",
    descriptionAr: "دجاج كامل وقطع ومنتجات دواجن مصنعة، محفوظة بدرجة حرارة تجميد ثابتة من الاستلام حتى التسليم.",
    children: [
      {
        slug: "whole-chickens",
        nameEn: "Whole Chickens",
        nameAr: "دجاج كامل",
        descriptionEn: "Whole frozen chickens in a range of sizes for foodservice and wholesale.",
        descriptionAr: "دجاج مجمد كامل بأحجام متعددة لقطاع الضيافة والجملة.",
      },
      {
        slug: "chicken-cuts",
        nameEn: "Chicken Cuts & Portions",
        nameAr: "قطع وأجزاء الدجاج",
        descriptionEn: "Portioned cuts — breast, thigh, wing, and drumstick — for menu-ready prep.",
        descriptionAr: "قطع مجزأة — صدر وفخذ وجناح وساق — جاهزة للتحضير في القوائم.",
      },
      {
        slug: "processed-poultry",
        nameEn: "Processed Poultry",
        nameAr: "منتجات دواجن مصنعة",
        descriptionEn: "Breaded, marinated, and further-processed poultry products.",
        descriptionAr: "منتجات دواجن مغلفة بالبقسماط ومتبلة ومصنعة.",
      },
    ],
  },
  {
    slug: "frozen-seafood",
    icon: "🐟",
    nameEn: "Frozen Seafood",
    nameAr: "مأكولات بحرية مجمدة",
    descriptionEn: "Whitefish, shellfish, and prepared seafood held at frozen temperature throughout the cold chain.",
    descriptionAr: "أسماك بيضاء ومحار ومأكولات بحرية محضّرة، محفوظة بدرجة حرارة التجميد طوال سلسلة التبريد.",
    children: [
      {
        slug: "whitefish-fillets",
        nameEn: "Whitefish & Fillets",
        nameAr: "الأسماك البيضاء والفيليه",
        descriptionEn: "Skinless and skin-on fillets from a range of whitefish species.",
        descriptionAr: "فيليه بجلد وبدون جلد من مجموعة متنوعة من الأسماك البيضاء.",
      },
      {
        slug: "shrimp-shellfish",
        nameEn: "Shrimp & Shellfish",
        nameAr: "الجمبري والمحار",
        descriptionEn: "Peeled, deveined, and shell-on shrimp plus other shellfish varieties.",
        descriptionAr: "جمبري مقشر ومنزوع العرق وبقشره، بالإضافة إلى أنواع أخرى من المحار.",
      },
    ],
  },
  {
    slug: "frozen-meat",
    icon: "🥩",
    nameEn: "Frozen Meat",
    nameAr: "لحوم مجمدة",
    descriptionEn: "Beef and lamb cuts for wholesale and foodservice, held frozen from receiving to delivery.",
    descriptionAr: "قطع لحم بقري وضأني للجملة وقطاع الضيافة، محفوظة مجمدة من الاستلام حتى التسليم.",
    children: [
      {
        slug: "beef",
        nameEn: "Beef",
        nameAr: "لحم بقري",
        descriptionEn: "Portioned and bulk beef cuts.",
        descriptionAr: "قطع لحم بقري مجزأة وبالجملة.",
      },
      {
        slug: "lamb",
        nameEn: "Lamb",
        nameAr: "لحم ضأن",
        descriptionEn: "Whole cuts and portioned lamb for foodservice menus.",
        descriptionAr: "قطع كاملة ومجزأة من لحم الضأن لقوائم قطاع الضيافة.",
      },
    ],
  },
  {
    slug: "frozen-produce",
    icon: "🥦",
    nameEn: "Frozen Vegetables & Fruits",
    nameAr: "خضروات وفواكه مجمدة",
    descriptionEn: "IQF vegetables and fruits that hold their texture and color through storage and prep.",
    descriptionAr: "خضروات وفواكه مجمدة سريعًا تحافظ على قوامها ولونها أثناء التخزين والتحضير.",
    children: [
      {
        slug: "frozen-vegetables",
        nameEn: "Vegetables",
        nameAr: "خضروات",
        descriptionEn: "Individually quick-frozen vegetables, whole and cut.",
        descriptionAr: "خضروات مجمدة سريعًا بشكل فردي، كاملة ومقطعة.",
      },
      {
        slug: "frozen-fruits",
        nameEn: "Fruits",
        nameAr: "فواكه",
        descriptionEn: "IQF fruit for beverages, bakery, and dessert applications.",
        descriptionAr: "فواكه مجمدة سريعًا للمشروبات والمخبوزات والحلويات.",
      },
    ],
  },
  {
    slug: "dairy-chilled",
    icon: "🧀",
    nameEn: "Dairy & Chilled",
    nameAr: "ألبان ومبردات",
    descriptionEn: "Cheese, butter, and cream held at chilled temperature through storage and delivery.",
    descriptionAr: "جبن وزبدة وكريمة محفوظة بدرجة حرارة التبريد أثناء التخزين والتسليم.",
    children: [
      {
        slug: "cheese",
        nameEn: "Cheese",
        nameAr: "جبن",
        descriptionEn: "Block, sliced, and shredded cheese for foodservice.",
        descriptionAr: "جبن على شكل قوالب وشرائح ومبشور لقطاع الضيافة.",
      },
      {
        slug: "butter-cream",
        nameEn: "Butter & Cream",
        nameAr: "زبدة وكريمة",
        descriptionEn: "Butter blocks and dairy cream for bakery and kitchen use.",
        descriptionAr: "قوالب زبدة وكريمة ألبان للاستخدام في المخابز والمطابخ.",
      },
    ],
  },
  {
    slug: "bakery-pantry",
    icon: "🥖",
    nameEn: "Bakery & Ambient Pantry",
    nameAr: "مخبوزات ومواد جافة",
    descriptionEn: "Ambient-stable bakery inputs and pantry staples.",
    descriptionAr: "مدخلات مخبوزات ومواد أساسية جافة تُحفظ بدرجة حرارة الغرفة.",
    children: [
      {
        slug: "bakery",
        nameEn: "Bakery",
        nameAr: "مخبوزات",
        descriptionEn: "Par-baked and frozen dough products for in-house finishing.",
        descriptionAr: "منتجات مخبوزة جزئيًا وعجائن مجمدة للتحضير النهائي داخل المطبخ.",
      },
      {
        slug: "pantry-staples",
        nameEn: "Pantry Staples",
        nameAr: "مواد أساسية",
        descriptionEn: "Rice, oils, and other ambient-stable foodservice staples.",
        descriptionAr: "أرز وزيوت ومواد أساسية أخرى تُحفظ بدرجة حرارة الغرفة لقطاع الضيافة.",
      },
    ],
  },
];

const BRANDS: { slug: string; nameEn: string; nameAr: string; descriptionEn: string; descriptionAr: string }[] = [
  {
    slug: "nordic-foods",
    nameEn: "Nordic Foods",
    nameAr: "نورديك فودز",
    descriptionEn: "Frozen seafood and whitefish sourced from northern waters.",
    descriptionAr: "مأكولات بحرية وأسماك بيضاء مجمدة من المياه الشمالية.",
  },
  {
    slug: "al-waha-farms",
    nameEn: "Al Waha Farms",
    nameAr: "مزارع الواحة",
    descriptionEn: "Regional poultry and meat processor supplying wholesale and foodservice.",
    descriptionAr: "معالج إقليمي للدواجن واللحوم يزود قطاعي الجملة والضيافة.",
  },
  {
    slug: "meadow-gold-dairy",
    nameEn: "Meadow Gold Dairy",
    nameAr: "ميدو غولد للألبان",
    descriptionEn: "Cheese, butter, and cream for foodservice kitchens.",
    descriptionAr: "جبن وزبدة وكريمة لمطابخ قطاع الضيافة.",
  },
  {
    slug: "coastal-catch",
    nameEn: "Coastal Catch",
    nameAr: "كوستال كاتش",
    descriptionEn: "Shrimp and shellfish processed and frozen at the point of catch.",
    descriptionAr: "جمبري ومحار يُعالج ويُجمد عند نقطة الصيد.",
  },
  {
    slug: "sunfield-produce",
    nameEn: "Sunfield Produce",
    nameAr: "سنفيلد للمنتجات الزراعية",
    descriptionEn: "IQF vegetables and fruits for foodservice and retail.",
    descriptionAr: "خضروات وفواكه مجمدة سريعًا لقطاعي الضيافة والتجزئة.",
  },
  {
    slug: "golden-grain-bakery",
    nameEn: "Golden Grain Bakery",
    nameAr: "غولدن غرين للمخبوزات",
    descriptionEn: "Par-baked bread and frozen dough for in-house finishing.",
    descriptionAr: "خبز مخبوز جزئيًا وعجائن مجمدة للتحضير النهائي داخل المطبخ.",
  },
];

const PRODUCTS: ProductSeed[] = [
  {
    sku: "FP-1001",
    slug: "whole-frozen-chicken",
    categorySlug: "whole-chickens",
    brandSlug: "al-waha-farms",
    temperatureClass: "FROZEN",
    originCountry: "Brazil",
    weight: "1.2 kg",
    dimensions: "25 × 18 × 10 cm",
    isFeatured: true,
    nameEn: "Whole Frozen Chicken",
    nameAr: "دجاج كامل مجمد",
    shortDescriptionEn: "Grade A whole chicken, individually bagged.",
    shortDescriptionAr: "دجاج كامل درجة أولى، معبأ بشكل فردي.",
    descriptionEn: "A whole grade-A chicken, cleaned and individually quick-frozen for consistent portioning and shelf life.",
    descriptionAr: "دجاج كامل درجة أولى، منظف ومجمد سريعًا بشكل فردي لضمان ثبات الوزن ومدة الصلاحية.",
    packagingEn: "Individually bagged, 10 birds per master carton.",
    packagingAr: "معبأ بشكل فردي، 10 دجاجات لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below. Do not refreeze after thawing.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل. لا يُعاد التجميد بعد الذوبان.",
    ingredientsEn: "100% chicken.",
    ingredientsAr: "100% دجاج.",
    nutritionInfoEn: "Per 100g (approx.): 165 kcal, 31g protein, 3.6g fat, 0g carbohydrate.",
    nutritionInfoAr: "لكل 100 جم (تقريبًا): 165 سعرة حرارية، 31 جم بروتين، 3.6 جم دهون، 0 جم كربوهيدرات.",
    allergensEn: "None.",
    allergensAr: "لا يوجد.",
  },
  {
    sku: "FP-1002",
    slug: "chicken-breast-fillet",
    categorySlug: "chicken-cuts",
    brandSlug: "al-waha-farms",
    temperatureClass: "FROZEN",
    originCountry: "Brazil",
    weight: "1 kg",
    dimensions: "20 × 15 × 8 cm",
    isFeatured: true,
    nameEn: "Chicken Breast Fillet, Boneless & Skinless",
    nameAr: "فيليه صدر دجاج بدون عظم وجلد",
    shortDescriptionEn: "Trimmed boneless breast fillet, IQF.",
    shortDescriptionAr: "فيليه صدر منزوع العظم ومقصوص، مجمد سريعًا.",
    descriptionEn: "Boneless, skinless breast fillets, trimmed and individually quick-frozen for easy portion control.",
    descriptionAr: "فيليه صدر بدون عظم أو جلد، مقصوص ومجمد سريعًا بشكل فردي لسهولة التحكم بالحصص.",
    packagingEn: "1kg poly bags, 10 bags per master carton.",
    packagingAr: "أكياس بلاستيكية 1 كجم، 10 أكياس لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    ingredientsEn: "100% chicken breast.",
    ingredientsAr: "100% صدر دجاج.",
    nutritionInfoEn: "Per 100g (approx.): 120 kcal, 22.5g protein, 2.6g fat.",
    nutritionInfoAr: "لكل 100 جم (تقريبًا): 120 سعرة حرارية، 22.5 جم بروتين، 2.6 جم دهون.",
    allergensEn: "None.",
    allergensAr: "لا يوجد.",
  },
  {
    sku: "FP-1003",
    slug: "chicken-drumsticks",
    categorySlug: "chicken-cuts",
    brandSlug: "al-waha-farms",
    temperatureClass: "FROZEN",
    originCountry: "Brazil",
    weight: "2 kg",
    nameEn: "Chicken Drumsticks",
    nameAr: "أفخاذ دجاج سفلية",
    shortDescriptionEn: "Bone-in drumsticks, IQF.",
    shortDescriptionAr: "أفخاذ سفلية بالعظم، مجمدة سريعًا.",
    descriptionEn: "Bone-in chicken drumsticks, individually quick-frozen for consistent cooking and portioning.",
    descriptionAr: "أفخاذ دجاج سفلية بالعظم، مجمدة سريعًا بشكل فردي لضمان ثبات الطهي والوزن.",
    packagingEn: "2kg poly bags, 6 bags per master carton.",
    packagingAr: "أكياس بلاستيكية 2 كجم، 6 أكياس لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    allergensEn: "None.",
    allergensAr: "لا يوجد.",
  },
  {
    sku: "FP-1004",
    slug: "breaded-chicken-strips",
    categorySlug: "processed-poultry",
    brandSlug: "al-waha-farms",
    temperatureClass: "FROZEN",
    originCountry: "Saudi Arabia",
    weight: "1 kg",
    nameEn: "Breaded Chicken Strips",
    nameAr: "أصابع دجاج مغلفة بالبقسماط",
    shortDescriptionEn: "Crispy-coated chicken strips, oven- or fry-ready.",
    shortDescriptionAr: "أصابع دجاج مقرمشة، جاهزة للفرن أو القلي.",
    descriptionEn: "Chicken breast strips coated in a crisp breadcrumb crust, par-fried and frozen — ready to finish in a fryer or oven.",
    descriptionAr: "أصابع من صدر الدجاج مغلفة بطبقة بقسماط مقرمشة، مقلية جزئيًا ومجمدة — جاهزة للتحضير النهائي في القلاية أو الفرن.",
    packagingEn: "1kg bags, 10 bags per master carton.",
    packagingAr: "أكياس 1 كجم، 10 أكياس لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    ingredientsEn: "Chicken breast, wheat breadcrumb coating, seasoning, vegetable oil.",
    ingredientsAr: "صدر دجاج، طبقة بقسماط من القمح، توابل، زيت نباتي.",
    allergensEn: "Contains: Wheat, gluten.",
    allergensAr: "يحتوي على: قمح، غلوتين.",
  },
  {
    sku: "FS-2001",
    slug: "hake-fillet",
    categorySlug: "whitefish-fillets",
    brandSlug: "nordic-foods",
    temperatureClass: "FROZEN",
    originCountry: "Turkey",
    weight: "1 kg",
    isFeatured: true,
    nameEn: "Hake Fillet, Skinless",
    nameAr: "فيليه سمك النازلي بدون جلد",
    shortDescriptionEn: "Skinless whitefish fillet, IQF.",
    shortDescriptionAr: "فيليه سمك أبيض بدون جلد، مجمد سريعًا.",
    descriptionEn: "Skinless hake fillets, individually quick-frozen at sea for a firm texture and neutral flavor.",
    descriptionAr: "فيليه سمك النازلي بدون جلد، مجمد سريعًا في البحر لضمان قوام متماسك ونكهة معتدلة.",
    packagingEn: "1kg vacuum-sealed bags, 10 bags per master carton.",
    packagingAr: "أكياس مفرغة من الهواء 1 كجم، 10 أكياس لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    ingredientsEn: "100% hake.",
    ingredientsAr: "100% سمك نازلي.",
    nutritionInfoEn: "Per 100g (approx.): 90 kcal, 18g protein, 1.3g fat.",
    nutritionInfoAr: "لكل 100 جم (تقريبًا): 90 سعرة حرارية، 18 جم بروتين، 1.3 جم دهون.",
    allergensEn: "Contains: Fish.",
    allergensAr: "يحتوي على: أسماك.",
  },
  {
    sku: "FS-2002",
    slug: "salmon-fillet-skin-on",
    categorySlug: "whitefish-fillets",
    brandSlug: "nordic-foods",
    temperatureClass: "FROZEN",
    originCountry: "France",
    weight: "1 kg",
    isFeatured: true,
    nameEn: "Salmon Fillet, Skin-On",
    nameAr: "فيليه سلمون بالجلد",
    shortDescriptionEn: "Skin-on salmon fillet portions, IQF.",
    shortDescriptionAr: "أجزاء فيليه سلمون بالجلد، مجمدة سريعًا.",
    descriptionEn: "Skin-on salmon fillet, portion-cut and individually quick-frozen to preserve color and texture.",
    descriptionAr: "فيليه سلمون بالجلد، مقطع لأجزاء ومجمد سريعًا بشكل فردي للحفاظ على اللون والقوام.",
    packagingEn: "1kg vacuum-sealed bags, 10 bags per master carton.",
    packagingAr: "أكياس مفرغة من الهواء 1 كجم، 10 أكياس لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    ingredientsEn: "100% salmon.",
    ingredientsAr: "100% سلمون.",
    nutritionInfoEn: "Per 100g (approx.): 208 kcal, 20g protein, 13g fat.",
    nutritionInfoAr: "لكل 100 جم (تقريبًا): 208 سعرة حرارية، 20 جم بروتين، 13 جم دهون.",
    allergensEn: "Contains: Fish.",
    allergensAr: "يحتوي على: أسماك.",
  },
  {
    sku: "FS-2003",
    slug: "shrimp-peeled-deveined",
    categorySlug: "shrimp-shellfish",
    brandSlug: "coastal-catch",
    temperatureClass: "FROZEN",
    originCountry: "India",
    weight: "800 g",
    isFeatured: true,
    nameEn: "Shrimp, Peeled & Deveined",
    nameAr: "جمبري مقشر ومنزوع العرق",
    shortDescriptionEn: "Peeled, deveined, tail-off shrimp, IQF.",
    shortDescriptionAr: "جمبري مقشر ومنزوع العرق وبدون ذيل، مجمد سريعًا.",
    descriptionEn: "Peeled and deveined shrimp, tail removed, individually quick-frozen for kitchen-ready use.",
    descriptionAr: "جمبري مقشر ومنزوع العرق، بدون ذيل، مجمد سريعًا بشكل فردي وجاهز للاستخدام في المطبخ.",
    packagingEn: "800g bags, 12 bags per master carton.",
    packagingAr: "أكياس 800 جم، 12 كيسًا لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    ingredientsEn: "100% shrimp.",
    ingredientsAr: "100% جمبري.",
    allergensEn: "Contains: Crustaceans.",
    allergensAr: "يحتوي على: قشريات.",
  },
  {
    sku: "FS-2004",
    slug: "shrimp-shell-on-jumbo",
    categorySlug: "shrimp-shellfish",
    brandSlug: "coastal-catch",
    temperatureClass: "FROZEN",
    originCountry: "India",
    weight: "1 kg",
    nameEn: "Jumbo Shrimp, Shell-On",
    nameAr: "جمبري جامبو بقشره",
    shortDescriptionEn: "Large shell-on shrimp, head-off, IQF.",
    shortDescriptionAr: "جمبري كبير الحجم بقشره وبدون رأس، مجمد سريعًا.",
    descriptionEn: "Head-off, shell-on jumbo shrimp, individually quick-frozen and graded for size consistency.",
    descriptionAr: "جمبري جامبو بقشره وبدون رأس، مجمد سريعًا ومصنف لضمان ثبات الحجم.",
    packagingEn: "1kg bags, 10 bags per master carton.",
    packagingAr: "أكياس 1 كجم، 10 أكياس لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    allergensEn: "Contains: Crustaceans.",
    allergensAr: "يحتوي على: قشريات.",
  },
  {
    sku: "FM-3001",
    slug: "beef-tenderloin",
    categorySlug: "beef",
    brandSlug: "al-waha-farms",
    temperatureClass: "FROZEN",
    originCountry: "Brazil",
    weight: "2 kg",
    isFeatured: true,
    nameEn: "Beef Tenderloin",
    nameAr: "لحم بقري تندرلوين",
    shortDescriptionEn: "Trimmed whole tenderloin, vacuum-packed.",
    shortDescriptionAr: "تندرلوين كامل مقصوص، معبأ بالفراغ.",
    descriptionEn: "A whole trimmed beef tenderloin, vacuum-packed and frozen to preserve tenderness.",
    descriptionAr: "تندرلوين لحم بقري كامل مقصوص، معبأ بالفراغ ومجمد للحفاظ على الطراوة.",
    packagingEn: "Vacuum-packed, individually cartoned.",
    packagingAr: "معبأ بالفراغ، في كرتون فردي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    ingredientsEn: "100% beef.",
    ingredientsAr: "100% لحم بقري.",
    nutritionInfoEn: "Per 100g (approx.): 143 kcal, 22g protein, 5.5g fat.",
    nutritionInfoAr: "لكل 100 جم (تقريبًا): 143 سعرة حرارية، 22 جم بروتين، 5.5 جم دهون.",
    allergensEn: "None.",
    allergensAr: "لا يوجد.",
  },
  {
    sku: "FM-3002",
    slug: "beef-cubes-stew",
    categorySlug: "beef",
    brandSlug: "al-waha-farms",
    temperatureClass: "FROZEN",
    originCountry: "Brazil",
    weight: "1 kg",
    nameEn: "Beef Cubes, Stew Cut",
    nameAr: "مكعبات لحم بقري للطبخ",
    shortDescriptionEn: "Diced beef, IQF, ready for stew or grill.",
    shortDescriptionAr: "لحم بقري مكعب، مجمد سريعًا، جاهز للطبخ أو الشوي.",
    descriptionEn: "Diced beef cubes cut for stewing or grilling, individually quick-frozen for easy portioning.",
    descriptionAr: "مكعبات لحم بقري مقطعة للطهي أو الشوي، مجمدة سريعًا بشكل فردي لسهولة التحكم بالوزن.",
    packagingEn: "1kg bags, 10 bags per master carton.",
    packagingAr: "أكياس 1 كجم، 10 أكياس لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    allergensEn: "None.",
    allergensAr: "لا يوجد.",
  },
  {
    sku: "FM-3003",
    slug: "lamb-shoulder-boneless",
    categorySlug: "lamb",
    brandSlug: "al-waha-farms",
    temperatureClass: "FROZEN",
    originCountry: "Saudi Arabia",
    weight: "1.5 kg",
    isFeatured: true,
    nameEn: "Lamb Shoulder, Boneless",
    nameAr: "كتف ضأن بدون عظم",
    shortDescriptionEn: "Boneless lamb shoulder, netted.",
    shortDescriptionAr: "كتف ضأن بدون عظم، مربوط بشبكة.",
    descriptionEn: "Boneless lamb shoulder, rolled and netted, frozen for consistent roasting or braising.",
    descriptionAr: "كتف ضأن بدون عظم، ملفوف ومربوط بشبكة، مجمد لضمان ثبات النتيجة عند الشوي أو الطهي البطيء.",
    packagingEn: "Vacuum-packed, individually cartoned.",
    packagingAr: "معبأ بالفراغ، في كرتون فردي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    allergensEn: "None.",
    allergensAr: "لا يوجد.",
  },
  {
    sku: "FM-3004",
    slug: "lamb-chops",
    categorySlug: "lamb",
    brandSlug: "al-waha-farms",
    temperatureClass: "FROZEN",
    originCountry: "Saudi Arabia",
    weight: "1 kg",
    nameEn: "Lamb Chops",
    nameAr: "ريش ضأن",
    shortDescriptionEn: "Portioned lamb loin chops, IQF.",
    shortDescriptionAr: "ريش ضأن مقطعة، مجمدة سريعًا.",
    descriptionEn: "Portioned lamb loin chops, individually quick-frozen for grill-ready service.",
    descriptionAr: "ريش ضأن مقطعة ومجمدة سريعًا بشكل فردي، جاهزة للشوي مباشرة.",
    packagingEn: "1kg bags, 10 bags per master carton.",
    packagingAr: "أكياس 1 كجم، 10 أكياس لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    allergensEn: "None.",
    allergensAr: "لا يوجد.",
  },
  {
    sku: "FV-4001",
    slug: "green-peas-iqf",
    categorySlug: "frozen-vegetables",
    brandSlug: "sunfield-produce",
    temperatureClass: "FROZEN",
    originCountry: "France",
    weight: "1 kg",
    nameEn: "Green Peas, IQF",
    nameAr: "بازلاء خضراء مجمدة سريعًا",
    shortDescriptionEn: "Individually quick-frozen green peas.",
    shortDescriptionAr: "بازلاء خضراء مجمدة سريعًا بشكل فردي.",
    descriptionEn: "Green peas picked at peak ripeness and individually quick-frozen to lock in color and texture.",
    descriptionAr: "بازلاء خضراء يتم قطفها في ذروة نضجها ومجمدة سريعًا بشكل فردي للحفاظ على اللون والقوام.",
    packagingEn: "1kg bags, 10 bags per master carton.",
    packagingAr: "أكياس 1 كجم، 10 أكياس لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    ingredientsEn: "100% green peas.",
    ingredientsAr: "100% بازلاء خضراء.",
    allergensEn: "None.",
    allergensAr: "لا يوجد.",
  },
  {
    sku: "FV-4002",
    slug: "mixed-vegetables-iqf",
    categorySlug: "frozen-vegetables",
    brandSlug: "sunfield-produce",
    temperatureClass: "FROZEN",
    originCountry: "France",
    weight: "1 kg",
    isFeatured: true,
    nameEn: "Mixed Vegetables, IQF",
    nameAr: "خضروات مشكلة مجمدة سريعًا",
    shortDescriptionEn: "Carrot, corn, and pea blend, IQF.",
    shortDescriptionAr: "خليط جزر وذرة وبازلاء، مجمد سريعًا.",
    descriptionEn: "A blend of diced carrot, sweet corn, and green peas, individually quick-frozen.",
    descriptionAr: "خليط من الجزر المكعب والذرة الحلوة والبازلاء الخضراء، مجمد سريعًا بشكل فردي.",
    packagingEn: "1kg bags, 10 bags per master carton.",
    packagingAr: "أكياس 1 كجم، 10 أكياس لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    ingredientsEn: "Carrot, sweet corn, green peas.",
    ingredientsAr: "جزر، ذرة حلوة، بازلاء خضراء.",
    allergensEn: "None.",
    allergensAr: "لا يوجد.",
  },
  {
    sku: "FV-4003",
    slug: "strawberries-iqf",
    categorySlug: "frozen-fruits",
    brandSlug: "sunfield-produce",
    temperatureClass: "FROZEN",
    originCountry: "Turkey",
    weight: "1 kg",
    nameEn: "Strawberries, IQF Whole",
    nameAr: "فراولة كاملة مجمدة سريعًا",
    shortDescriptionEn: "Whole IQF strawberries for beverage and bakery use.",
    shortDescriptionAr: "فراولة كاملة مجمدة سريعًا للمشروبات والمخبوزات.",
    descriptionEn: "Whole strawberries, individually quick-frozen at peak ripeness for beverage, bakery, and dessert use.",
    descriptionAr: "فراولة كاملة، مجمدة سريعًا في ذروة نضجها، مناسبة للمشروبات والمخبوزات والحلويات.",
    packagingEn: "1kg bags, 10 bags per master carton.",
    packagingAr: "أكياس 1 كجم، 10 أكياس لكل كرتون رئيسي.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    ingredientsEn: "100% strawberries.",
    ingredientsAr: "100% فراولة.",
    allergensEn: "None.",
    allergensAr: "لا يوجد.",
  },
  {
    sku: "DC-5001",
    slug: "mozzarella-block",
    categorySlug: "cheese",
    brandSlug: "meadow-gold-dairy",
    temperatureClass: "CHILLED",
    originCountry: "France",
    weight: "2 kg",
    isFeatured: true,
    nameEn: "Mozzarella Cheese Block",
    nameAr: "جبن موزاريلا قالب",
    shortDescriptionEn: "Low-moisture mozzarella block for foodservice.",
    shortDescriptionAr: "جبن موزاريلا قليل الرطوبة على شكل قالب لقطاع الضيافة.",
    descriptionEn: "Low-moisture, part-skim mozzarella in block form, sliced or shredded to order in-kitchen.",
    descriptionAr: "جبن موزاريلا قليل الرطوبة ونصف دسم على شكل قالب، يُقطع أو يُبشر حسب الحاجة في المطبخ.",
    packagingEn: "2kg vacuum-sealed block.",
    packagingAr: "قالب 2 كجم معبأ بالفراغ.",
    storageEn: "Store at 0–4°C. Keep refrigerated at all times.",
    storageAr: "يُحفظ بدرجة حرارة 0-4 مئوية. يجب إبقاؤه مبردًا طوال الوقت.",
    ingredientsEn: "Pasteurized milk, salt, cultures, enzymes.",
    ingredientsAr: "حليب مبستر، ملح، بادئات بكتيرية، إنزيمات.",
    allergensEn: "Contains: Milk.",
    allergensAr: "يحتوي على: حليب.",
  },
  {
    sku: "DC-5002",
    slug: "cheddar-sliced",
    categorySlug: "cheese",
    brandSlug: "meadow-gold-dairy",
    temperatureClass: "CHILLED",
    originCountry: "France",
    weight: "1 kg",
    nameEn: "Cheddar Cheese, Sliced",
    nameAr: "جبن شيدر شرائح",
    shortDescriptionEn: "Pre-sliced cheddar for sandwiches and burgers.",
    shortDescriptionAr: "جبن شيدر مقطع مسبقًا للسندويشات والبرغر.",
    descriptionEn: "Pre-sliced cheddar cheese, interleaved for easy separation, portioned for foodservice.",
    descriptionAr: "جبن شيدر مقطع مسبقًا وموضوع بينه ورق فاصل لسهولة الفصل، مجزأ لقطاع الضيافة.",
    packagingEn: "1kg interleaved slices.",
    packagingAr: "شرائح 1 كجم موضوع بينها ورق فاصل.",
    storageEn: "Store at 0–4°C. Keep refrigerated at all times.",
    storageAr: "يُحفظ بدرجة حرارة 0-4 مئوية. يجب إبقاؤه مبردًا طوال الوقت.",
    ingredientsEn: "Pasteurized milk, salt, cultures, enzymes, annatto (color).",
    ingredientsAr: "حليب مبستر، ملح، بادئات بكتيرية، إنزيمات، أناتو (ملون).",
    allergensEn: "Contains: Milk.",
    allergensAr: "يحتوي على: حليب.",
  },
  {
    sku: "DC-5003",
    slug: "unsalted-butter-block",
    categorySlug: "butter-cream",
    brandSlug: "meadow-gold-dairy",
    temperatureClass: "CHILLED",
    originCountry: "France",
    weight: "5 kg",
    nameEn: "Unsalted Butter Block",
    nameAr: "زبدة غير مملحة قالب",
    shortDescriptionEn: "Bulk unsalted butter for bakery use.",
    shortDescriptionAr: "زبدة غير مملحة بكميات كبيرة للاستخدام في المخابز.",
    descriptionEn: "Unsalted butter supplied in a 5kg block for bakery and pastry kitchens.",
    descriptionAr: "زبدة غير مملحة تُورد على شكل قالب 5 كجم لمطابخ المخابز والحلويات.",
    packagingEn: "5kg block, wrapped.",
    packagingAr: "قالب 5 كجم مغلف.",
    storageEn: "Store at 0–4°C. Keep refrigerated at all times.",
    storageAr: "يُحفظ بدرجة حرارة 0-4 مئوية. يجب إبقاؤه مبردًا طوال الوقت.",
    ingredientsEn: "Pasteurized cream.",
    ingredientsAr: "كريمة مبسترة.",
    allergensEn: "Contains: Milk.",
    allergensAr: "يحتوي على: حليب.",
  },
  {
    sku: "DC-5004",
    slug: "whipping-cream",
    categorySlug: "butter-cream",
    brandSlug: "meadow-gold-dairy",
    temperatureClass: "CHILLED",
    originCountry: "France",
    weight: "1 L",
    nameEn: "Whipping Cream, 35% Fat",
    nameAr: "كريمة خفق 35% دهون",
    shortDescriptionEn: "Dairy whipping cream for kitchen and bakery use.",
    shortDescriptionAr: "كريمة ألبان للخفق، للاستخدام في المطبخ والمخبز.",
    descriptionEn: "35% fat dairy whipping cream, UHT-treated for extended shelf life under refrigeration.",
    descriptionAr: "كريمة ألبان للخفق بنسبة دهون 35%، معالجة بتقنية UHT لإطالة مدة الصلاحية عند التبريد.",
    packagingEn: "1L cartons, 12 per case.",
    packagingAr: "علب كرتون 1 لتر، 12 علبة لكل كرتون.",
    storageEn: "Store at 0–4°C. Keep refrigerated at all times.",
    storageAr: "يُحفظ بدرجة حرارة 0-4 مئوية. يجب إبقاؤه مبردًا طوال الوقت.",
    ingredientsEn: "Pasteurized cream, stabilizer.",
    ingredientsAr: "كريمة مبسترة، مثبت.",
    allergensEn: "Contains: Milk.",
    allergensAr: "يحتوي على: حليب.",
  },
  {
    sku: "BP-6001",
    slug: "par-baked-baguette",
    categorySlug: "bakery",
    brandSlug: "golden-grain-bakery",
    temperatureClass: "FROZEN",
    originCountry: "France",
    weight: "250 g",
    nameEn: "Par-Baked Baguette",
    nameAr: "باغيت مخبوز جزئيًا",
    shortDescriptionEn: "Par-baked frozen baguette, finish in-house.",
    shortDescriptionAr: "باغيت مجمد مخبوز جزئيًا، يُنجز التحضير داخل المطبخ.",
    descriptionEn: "A par-baked baguette, frozen for a short bake-off finish that delivers fresh-baked results.",
    descriptionAr: "باغيت مخبوز جزئيًا ومجمد، يحتاج لإنهاء خبز قصير للحصول على نتيجة طازجة.",
    packagingEn: "Individually wrapped, 20 per case.",
    packagingAr: "مغلف بشكل فردي، 20 قطعة لكل كرتون.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    ingredientsEn: "Wheat flour, water, yeast, salt.",
    ingredientsAr: "دقيق قمح، ماء، خميرة، ملح.",
    allergensEn: "Contains: Wheat, gluten.",
    allergensAr: "يحتوي على: قمح، غلوتين.",
  },
  {
    sku: "BP-6002",
    slug: "frozen-croissant-dough",
    categorySlug: "bakery",
    brandSlug: "golden-grain-bakery",
    temperatureClass: "FROZEN",
    originCountry: "France",
    weight: "60 g",
    isFeatured: true,
    nameEn: "Frozen Butter Croissant Dough",
    nameAr: "عجينة كرواسون بالزبدة مجمدة",
    shortDescriptionEn: "Ready-to-proof butter croissant dough.",
    shortDescriptionAr: "عجينة كرواسون بالزبدة جاهزة للتخمير.",
    descriptionEn: "Pre-shaped butter croissant dough, frozen and ready to proof and bake in-house.",
    descriptionAr: "عجينة كرواسون بالزبدة مشكلة مسبقًا، مجمدة وجاهزة للتخمير والخبز داخل المطبخ.",
    packagingEn: "60g pieces, 60 per case.",
    packagingAr: "قطع 60 جم، 60 قطعة لكل كرتون.",
    storageEn: "Store at -18°C or below.",
    storageAr: "يُحفظ بدرجة حرارة -18 مئوية أو أقل.",
    ingredientsEn: "Wheat flour, butter, water, yeast, sugar, salt.",
    ingredientsAr: "دقيق قمح، زبدة، ماء، خميرة، سكر، ملح.",
    allergensEn: "Contains: Wheat, gluten, milk.",
    allergensAr: "يحتوي على: قمح، غلوتين، حليب.",
  },
  {
    sku: "BP-6003",
    slug: "basmati-rice-25kg",
    categorySlug: "pantry-staples",
    temperatureClass: "AMBIENT",
    originCountry: "India",
    weight: "25 kg",
    nameEn: "Basmati Rice",
    nameAr: "أرز بسمتي",
    shortDescriptionEn: "Long-grain basmati rice, bulk sack.",
    shortDescriptionAr: "أرز بسمتي طويل الحبة، كيس بالجملة.",
    descriptionEn: "Long-grain aged basmati rice supplied in bulk sacks for foodservice kitchens.",
    descriptionAr: "أرز بسمتي طويل الحبة ومعتق، يُورد بأكياس بالجملة لمطابخ قطاع الضيافة.",
    packagingEn: "25kg woven sack.",
    packagingAr: "كيس منسوج 25 كجم.",
    storageEn: "Store in a cool, dry place away from direct sunlight.",
    storageAr: "يُحفظ في مكان بارد وجاف بعيدًا عن أشعة الشمس المباشرة.",
    ingredientsEn: "100% basmati rice.",
    ingredientsAr: "100% أرز بسمتي.",
    allergensEn: "None.",
    allergensAr: "لا يوجد.",
  },
  {
    sku: "BP-6004",
    slug: "sunflower-oil-jerrycan",
    categorySlug: "pantry-staples",
    temperatureClass: "AMBIENT",
    originCountry: "Turkey",
    weight: "20 L",
    nameEn: "Sunflower Oil",
    nameAr: "زيت دوار الشمس",
    shortDescriptionEn: "Refined sunflower oil, bulk jerrycan.",
    shortDescriptionAr: "زيت دوار الشمس المكرر، عبوة بالجملة.",
    descriptionEn: "Refined sunflower cooking oil supplied in a 20L jerrycan for high-volume kitchen use.",
    descriptionAr: "زيت طهي دوار الشمس المكرر، يُورد بعبوة 20 لتر للاستخدام في المطابخ عالية الحجم.",
    packagingEn: "20L jerrycan.",
    packagingAr: "عبوة 20 لتر.",
    storageEn: "Store in a cool, dry place away from direct sunlight.",
    storageAr: "يُحفظ في مكان بارد وجاف بعيدًا عن أشعة الشمس المباشرة.",
    ingredientsEn: "100% refined sunflower oil.",
    ingredientsAr: "100% زيت دوار الشمس المكرر.",
    allergensEn: "None.",
    allergensAr: "لا يوجد.",
  },
];

const BLOG_POSTS: {
  slug: string;
  categoryNameEn: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  contentEn: string;
  contentAr: string;
}[] = [
  {
    slug: "why-cold-chain-discipline-matters",
    categoryNameEn: "Cold Chain",
    titleEn: "Why Cold Chain Discipline Matters More Than It Gets Credit For",
    titleAr: "لماذا يستحق انضباط سلسلة التبريد اهتمامًا أكبر مما يحظى به",
    excerptEn: "A single break in temperature control can undo everything upstream. Here's what discipline actually looks like in practice.",
    excerptAr: "انقطاع واحد في التحكم بدرجة الحرارة قد يُبطل كل ما تم إنجازه سابقًا. إليك كيف يبدو الانضباط فعليًا على أرض الواقع.",
    contentEn:
      "Cold chain discipline is easy to talk about and hard to actually maintain. It means every link — receiving, storage, staging, and delivery — holds the product at the temperature class it requires, without exception and without shortcuts.\n\nThe most common failure point isn't the freezer or the truck — it's the handoff. A pallet sitting on a loading dock for twenty extra minutes, a delivery route that runs long on a hot afternoon, a staging area that isn't quite cold enough. Individually these look like small deviations. Compounded across a supply chain, they add up to real quality and safety risk.\n\nWhat actually works is treating temperature control as a system property, not a checklist item at any single stage. That means monitoring at every handoff, not just at the warehouse; it means routing deliveries to minimize time outside controlled storage; and it means being honest when something has gone wrong instead of hoping it goes unnoticed.",
    contentAr:
      "من السهل الحديث عن انضباط سلسلة التبريد، لكن من الصعب فعليًا الحفاظ عليه. فهو يعني أن كل حلقة — الاستلام والتخزين والتجهيز والتسليم — تحافظ على المنتج بدرجة الحرارة المطلوبة، دون استثناء ودون اختصارات.\n\nنقطة الفشل الأكثر شيوعًا ليست الفريزر أو الشاحنة — بل عملية التسليم بين الحلقات. منصة بضائع تبقى على رصيف التحميل لعشرين دقيقة إضافية، مسار توصيل يمتد لوقت أطول في عصر حار، منطقة تجهيز ليست باردة بما فيه الكفاية. كل انحراف بمفرده يبدو صغيرًا. لكن مجتمعة عبر سلسلة التوريد، تتراكم لتشكل مخاطر حقيقية على الجودة والسلامة.\n\nما ينجح فعليًا هو التعامل مع التحكم بدرجة الحرارة كخاصية للنظام ككل، وليس كبند في قائمة تحقق لمرحلة واحدة. هذا يعني المراقبة في كل عملية تسليم بين الحلقات، وليس فقط في المستودع؛ ويعني توجيه عمليات التسليم لتقليل الوقت خارج التخزين المُتحكم به؛ ويعني الصراحة عند حدوث خطأ ما بدلاً من التمني بألا يُلاحظ.",
  },
  {
    slug: "choosing-between-frozen-and-chilled-supply",
    categoryNameEn: "Operations",
    titleEn: "Frozen vs. Chilled: How to Choose the Right Supply Format for Your Menu",
    titleAr: "مجمد أم مبرد: كيف تختار صيغة التوريد المناسبة لقائمتك",
    excerptEn: "The right answer depends less on the ingredient and more on how your kitchen actually operates day to day.",
    excerptAr: "الإجابة الصحيحة تعتمد بشكل أقل على المكوّن نفسه وأكثر على طريقة عمل مطبخك يوميًا.",
    contentEn:
      "Kitchens often default to whichever format they've always used, without revisiting whether it still fits how the operation actually runs. It's worth reconsidering periodically.\n\nFrozen supply buys flexibility — longer shelf life, less waste from over-ordering, and insulation against delivery schedule disruptions. The tradeoff is prep time: frozen product needs a thaw cycle built into kitchen workflow, which matters most for high-turnover items ordered close to service.\n\nChilled supply is the better fit when a kitchen has reliable, frequent delivery and tight par levels — less storage overhead, faster prep-to-plate, but a narrower error margin if a delivery is late or a par count is off.\n\nMost foodservice operations end up running a mix: chilled for high-velocity staples with predictable demand, frozen for everything where flexibility matters more than immediacy.",
    contentAr:
      "غالبًا ما تعتمد المطابخ على الصيغة التي اعتادت عليها دائمًا، دون إعادة النظر فيما إذا كانت لا تزال مناسبة لطريقة عمل المنشأة فعليًا. من المفيد إعادة تقييم ذلك بشكل دوري.\n\nيوفر التوريد المجمد مرونة — مدة صلاحية أطول، وهدر أقل الناتج عن الطلب الزائد، وحماية من اضطرابات جداول التسليم. لكن المقابل هو وقت التحضير: يحتاج المنتج المجمد لدورة إذابة مدمجة في سير عمل المطبخ، وهو أمر مهم بشكل خاص للأصناف عالية الدوران التي تُطلب قريبًا من موعد التقديم.\n\nيكون التوريد المبرد الخيار الأنسب عندما يتمتع المطبخ بتسليم موثوق ومتكرر ومستويات مخزون دقيقة — تكاليف تخزين أقل، وتحضير أسرع حتى التقديم، لكن هامش خطأ أضيق في حال تأخر التسليم أو عدم دقة كمية المخزون.\n\nمعظم منشآت قطاع الضيافة تنتهي باستخدام مزيج من الاثنين: مبرد للأصناف عالية الدوران ذات الطلب المتوقع، ومجمد لكل ما تكون فيه المرونة أهم من الفورية.",
  },
  {
    slug: "reading-a-product-spec-sheet",
    categoryNameEn: "Sourcing",
    titleEn: "What to Actually Look For on a Product Spec Sheet",
    titleAr: "ما الذي يجب البحث عنه فعليًا في ورقة مواصفات المنتج",
    excerptEn: "Weight and packaging are the easy parts. These are the details that actually predict how a product performs in your kitchen.",
    excerptAr: "الوزن والتعبئة هما الجزء السهل. هذه هي التفاصيل التي تتنبأ فعليًا بأداء المنتج في مطبخك.",
    contentEn:
      "A spec sheet is only useful if you know what to check beyond the headline numbers. Weight and pack count matter, but they don't tell you how a product will actually behave once it's in your kitchen.\n\nStart with storage conditions and confirm they match what your facility can actually maintain — not just on paper, but during a delivery delay or a busy service when a walk-in door is open longer than it should be.\n\nPackaging format matters more than it looks. A product packed in large blocks versus individually quick-frozen portions changes prep time, waste, and thaw behavior significantly, even if the underlying product is identical.\n\nFinally, read origin and any allergen or ingredient information carefully if the product is going anywhere near a menu with dietary claims — a spec sheet is the first place a labeling mistake gets caught, or missed.",
    contentAr:
      "ورقة المواصفات مفيدة فقط إذا عرفت ما الذي يجب التحقق منه بخلاف الأرقام الرئيسية. الوزن وعدد القطع في العبوة مهمان، لكنهما لا يخبرانك كيف سيتصرف المنتج فعليًا داخل مطبخك.\n\nابدأ بشروط التخزين وتأكد من أنها تتطابق مع ما يمكن لمنشأتك الحفاظ عليه فعليًا — ليس فقط على الورق، بل أثناء تأخر التسليم أو خدمة مزدحمة حين يبقى باب غرفة التبريد مفتوحًا لفترة أطول من اللازم.\n\nصيغة التعبئة أهم مما تبدو عليه. منتج معبأ في قوالب كبيرة مقابل أجزاء مجمدة سريعًا بشكل فردي يُغيّر وقت التحضير والهدر وسلوك الذوبان بشكل كبير، حتى لو كان المنتج الأساسي نفسه.\n\nأخيرًا، اقرأ معلومات المنشأ وأي معلومات عن مسببات الحساسية أو المكونات بعناية إذا كان المنتج سيُستخدم في قائمة تحمل ادعاءات غذائية معينة — فورقة المواصفات هي أول مكان يُكتشف فيه خطأ في وضع العلامات، أو يُفوّت.",
  },
  {
    slug: "managing-par-levels-across-temperature-classes",
    categoryNameEn: "Operations",
    titleEn: "Managing Par Levels When You're Juggling Three Temperature Classes",
    titleAr: "إدارة مستويات المخزون عند التعامل مع ثلاث فئات حرارية مختلفة",
    excerptEn: "Frozen, chilled, and ambient inventory don't behave the same way — treating them identically is where par-level planning usually breaks down.",
    excerptAr: "المخزون المجمد والمبرد والعادي لا يتصرف بالطريقة نفسها — التعامل معها بشكل متطابق هو ما يتسبب عادة في فشل تخطيط مستويات المخزون.",
    contentEn:
      "It's tempting to set par levels the same way across every category, but frozen, chilled, and ambient inventory carry very different risk profiles, and treating them the same is a common source of both waste and stockouts.\n\nAmbient stock is the most forgiving — long shelf life means par levels can run higher without much downside, mainly limited by storage space and cash tied up in inventory.\n\nChilled stock needs the tightest management. Shelf life is short enough that over-ordering turns into waste quickly, but under-ordering creates gaps that are hard to fill on short notice since chilled delivery windows tend to be less flexible.\n\nFrozen sits in between — the long shelf life gives room for error, but freezer capacity is usually the real constraint, not spoilage risk. The practical approach is setting par levels per category based on its actual constraint, not a single formula applied everywhere.",
    contentAr:
      "من المغري تحديد مستويات المخزون بالطريقة نفسها لكل فئة، لكن المخزون المجمد والمبرد والعادي يحمل ملفات مخاطر مختلفة جدًا، والتعامل معها بنفس الطريقة هو مصدر شائع للهدر ونفاد المخزون على حد سواء.\n\nالمخزون العادي هو الأكثر تسامحًا — مدة الصلاحية الطويلة تعني إمكانية رفع مستويات المخزون دون عواقب كبيرة، محدودة بشكل رئيسي بمساحة التخزين ورأس المال المرتبط بالمخزون.\n\nيحتاج المخزون المبرد لإدارة أكثر دقة. مدة الصلاحية قصيرة بما يكفي لأن يتحول الطلب الزائد إلى هدر بسرعة، لكن الطلب الناقص يخلق فجوات يصعب سدها بإشعار قصير، لأن نوافذ التسليم المبرد تميل لأن تكون أقل مرونة.\n\nيقع المخزون المجمد في المنتصف — مدة الصلاحية الطويلة تمنح هامشًا للخطأ، لكن سعة الفريزر عادة ما تكون القيد الحقيقي، وليس خطر التلف. النهج العملي هو تحديد مستويات المخزون لكل فئة بناءً على قيدها الفعلي، وليس صيغة واحدة تُطبق على الجميع.",
  },
  {
    slug: "understanding-food-allergen-labeling",
    categoryNameEn: "Food Safety",
    titleEn: "A Practical Guide to Allergen Information on Wholesale Product Labels",
    titleAr: "دليل عملي لمعلومات مسببات الحساسية على ملصقات منتجات الجملة",
    excerptEn: "Allergen labeling on a bulk product isn't the same as a restaurant menu disclosure — here's the distinction that matters for kitchens.",
    excerptAr: "وضع علامات مسببات الحساسية على منتج بالجملة ليس مثل الإفصاح في قائمة مطعم — إليك الفرق المهم للمطابخ.",
    contentEn:
      "Allergen information on a wholesale spec sheet exists to tell a kitchen what's actually in the product it received — it isn't a substitute for the kitchen's own allergen management once that product enters a recipe.\n\nThe distinction matters because a kitchen combining ingredients creates new allergen exposure that no single supplier's label can capture. A breaded product's spec sheet will correctly list wheat and gluten; it won't know that the same fryer is also used for a shellfish item, and that's a kitchen-level control question, not a labeling one.\n\nThe practical habit worth building is treating supplier allergen declarations as an input to your own kitchen's allergen matrix, not the final word on what's safe to serve. Cross-check every new product against your actual prep and cooking process, not just its ingredient list.",
    contentAr:
      "توجد معلومات مسببات الحساسية على ورقة مواصفات منتج الجملة لإخبار المطبخ بما يحتويه المنتج الذي استلمه فعليًا — وهي ليست بديلاً عن إدارة المطبخ الخاصة لمسببات الحساسية بمجرد دخول ذلك المنتج ضمن وصفة ما.\n\nهذا الفرق مهم لأن المطبخ الذي يجمع بين مكونات مختلفة يخلق تعرضًا جديدًا لمسببات الحساسية لا يمكن لملصق أي مورّد بمفرده أن يعكسه. ورقة مواصفات منتج مغلف بالبقسماط ستذكر بشكل صحيح القمح والغلوتين؛ لكنها لن تعرف أن نفس القلاية تُستخدم أيضًا لصنف من المحار، وهذه مسألة تحكم على مستوى المطبخ، وليست مسألة وضع علامات.\n\nالعادة العملية التي يستحق بناؤها هي التعامل مع إفصاحات المورّد عن مسببات الحساسية كمُدخل لمصفوفة الحساسية الخاصة بمطبخك، وليس الكلمة الأخيرة حول ما هو آمن للتقديم. راجع كل منتج جديد مقابل عملية التحضير والطهي الفعلية لديك، وليس فقط قائمة مكوناته.",
  },
  {
    slug: "why-packaging-format-changes-waste",
    categoryNameEn: "Operations",
    titleEn: "The Packaging Format You Order Changes How Much You Throw Away",
    titleAr: "صيغة التعبئة التي تطلبها تُغيّر كمية ما تتخلص منه",
    excerptEn: "Bulk blocks and individually frozen portions cost differently at the register but not necessarily at the end of the week.",
    excerptAr: "القوالب الكبيرة والأجزاء المجمدة بشكل فردي تختلف في التكلفة عند الشراء، لكن ليس بالضرورة في نهاية الأسبوع.",
    contentEn:
      "It's easy to compare packaging formats purely on unit price, but the format itself has a real cost that only shows up later — in thawed product that didn't get used, or prep time spent portioning a block that individually frozen units would have skipped entirely.\n\nBulk block packaging is usually cheaper per kilogram, but every thaw cycle commits the whole block — there's no partial-thaw option without compromising the rest. That works fine for high-volume, predictable items, and poorly for anything with variable daily demand.\n\nIndividually quick-frozen (IQF) formats cost more per unit but let a kitchen thaw exactly what's needed, which usually offsets the price difference in reduced waste alone, before counting the labor saved from not portioning a frozen block by hand.\n\nThe right call depends on how predictable your daily usage actually is for that specific item, not a blanket policy applied across the whole order.",
    contentAr:
      "من السهل مقارنة صيغ التعبئة بناءً على سعر الوحدة فقط، لكن الصيغة نفسها تحمل تكلفة حقيقية لا تظهر إلا لاحقًا — في منتج تم إذابته ولم يُستخدم، أو وقت تحضير أُنفق في تقطيع قالب كانت الوحدات المجمدة الفردية ستوفره بالكامل.\n\nتعبئة القوالب الكبيرة أرخص عادة لكل كيلوغرام، لكن كل دورة إذابة تُلزمك بالقالب بأكمله — لا يوجد خيار للإذابة الجزئية دون التأثير على الباقي. هذا يعمل بشكل جيد للأصناف عالية الحجم وذات الطلب المتوقع، وبشكل سيء لأي صنف ذي طلب يومي متغير.\n\nصيغ التجميد السريع الفردي (IQF) أغلى لكل وحدة لكنها تسمح للمطبخ بإذابة الكمية المطلوبة بالضبط فقط، وهو ما يعوّض عادة فرق السعر من خلال تقليل الهدر وحده، قبل احتساب توفير الوقت الناتج عن عدم تقطيع قالب مجمد يدويًا.\n\nالقرار الصحيح يعتمد على مدى قابلية استخدامك اليومي الفعلي لذلك الصنف تحديدًا للتنبؤ، وليس على سياسة عامة تُطبق على الطلبية بأكملها.",
  },
];

const FAQS: { questionEn: string; questionAr: string; answerEn: string; answerAr: string; category: string; order: number }[] = [
  {
    category: "Ordering",
    order: 0,
    questionEn: "How do I request a quote?",
    questionAr: "كيف يمكنني طلب عرض سعر؟",
    answerEn: "Use the \"Request a Quote\" button on any product page, or the contact form, with your product categories and order volumes. A member of the team will follow up with pricing and availability.",
    answerAr: "استخدم زر \"اطلب عرض سعر\" في أي صفحة منتج، أو نموذج التواصل، مع ذكر فئات المنتجات وأحجام الطلب. سيتواصل معك أحد أعضاء الفريق بالسعر والتوفر.",
  },
  {
    category: "Ordering",
    order: 1,
    questionEn: "Is there a minimum order quantity?",
    questionAr: "هل يوجد حد أدنى لكمية الطلب؟",
    answerEn: "Minimums vary by product and packaging format. Your account representative will confirm exact minimums when you request a quote.",
    answerAr: "تختلف الحدود الدنيا حسب المنتج وصيغة التعبئة. سيؤكد ممثل حسابك الحدود الدنيا الدقيقة عند طلب عرض السعر.",
  },
  {
    category: "Delivery",
    order: 2,
    questionEn: "What areas do you deliver to?",
    questionAr: "ما هي المناطق التي تغطيها خدمة التوصيل؟",
    answerEn: "We operate from Jeddah with distribution reach across the Kingdom. Delivery schedules are built around each customer's operation rather than a fixed weekly route.",
    answerAr: "نعمل من جدة مع تغطية توزيع تصل إلى مختلف مناطق المملكة. تُبنى جداول التسليم حول عملية كل عميل بدلاً من مسار أسبوعي ثابت.",
  },
  {
    category: "Delivery",
    order: 3,
    questionEn: "How is temperature maintained during delivery?",
    questionAr: "كيف يتم الحفاظ على درجة الحرارة أثناء التوصيل؟",
    answerEn: "Frozen, chilled, and ambient goods are transported in temperature-controlled vehicles appropriate to each product's required class, monitored from our storage facility through to your delivery point.",
    answerAr: "يتم نقل البضائع المجمدة والمبردة والعادية بمركبات مُتحكم بدرجة حرارتها بما يناسب الفئة الحرارية المطلوبة لكل منتج، مع المراقبة من مرفق التخزين لدينا وحتى نقطة التسليم لديك.",
  },
  {
    category: "Products",
    order: 4,
    questionEn: "Can I get a spec sheet or nutrition information before ordering?",
    questionAr: "هل يمكنني الحصول على ورقة مواصفات أو معلومات غذائية قبل الطلب؟",
    answerEn: "Yes — product pages include specifications, and where applicable, packaging, storage, ingredients, and nutrition information. Documents such as spec sheets are available for download on the product page when provided.",
    answerAr: "نعم — تتضمن صفحات المنتجات المواصفات، وعند الاقتضاء، معلومات التعبئة والتخزين والمكونات والمعلومات الغذائية. المستندات مثل أوراق المواصفات متاحة للتنزيل في صفحة المنتج عند توفرها.",
  },
  {
    category: "Products",
    order: 5,
    questionEn: "Do you supply products for specific dietary requirements?",
    questionAr: "هل توفرون منتجات تلبي متطلبات غذائية معينة؟",
    answerEn: "Allergen information is listed on each product page where applicable. If you have a specific dietary requirement, mention it when requesting a quote and our team will help identify suitable products.",
    answerAr: "يتم إدراج معلومات مسببات الحساسية في كل صفحة منتج عند الاقتضاء. إذا كان لديك متطلب غذائي محدد، يرجى ذكره عند طلب عرض السعر وسيساعدك فريقنا في تحديد المنتجات المناسبة.",
  },
  {
    category: "Account",
    order: 6,
    questionEn: "Do I need an account to request a quote?",
    questionAr: "هل أحتاج إلى حساب لطلب عرض سعر؟",
    answerEn: "No — you can submit a request through any product page or the contact page without an account. Our team will follow up to set up your wholesale account for ongoing orders.",
    answerAr: "لا — يمكنك تقديم طلب من خلال أي صفحة منتج أو صفحة التواصل دون الحاجة لحساب. سيتواصل معك فريقنا لإعداد حساب الجملة الخاص بك للطلبات المستمرة.",
  },
  {
    category: "Account",
    order: 7,
    questionEn: "How can I check the status of a submitted inquiry?",
    questionAr: "كيف يمكنني التحقق من حالة طلب تم تقديمه؟",
    answerEn: "A member of our team follows up directly by phone or email after you submit a request. Contact us directly if you'd like an update in the meantime.",
    answerAr: "سيتواصل معك أحد أعضاء فريقنا مباشرة عبر الهاتف أو البريد الإلكتروني بعد تقديم الطلب. تواصل معنا مباشرة إذا كنت ترغب بمعرفة آخر المستجدات في هذه الأثناء.",
  },
  {
    category: "General",
    order: 8,
    questionEn: "What temperature classes do you distribute?",
    questionAr: "ما هي الفئات الحرارية التي توزعونها؟",
    answerEn: "We distribute frozen, chilled, and ambient goods, each handled and stored to the standard its temperature class requires.",
    answerAr: "نوزع بضائع مجمدة ومبردة وعادية، يتم التعامل مع كل منها وتخزينها وفق المعيار الذي تتطلبه فئتها الحرارية.",
  },
  {
    category: "General",
    order: 9,
    questionEn: "Who do I contact for a question not covered here?",
    questionAr: "بمن أتصل لسؤال غير مذكور هنا؟",
    answerEn: "Use the contact form or the details on our Contact page, and a member of the team will get back to you.",
    answerAr: "استخدم نموذج التواصل أو البيانات الموجودة في صفحة التواصل، وسيتواصل معك أحد أعضاء الفريق.",
  },
];

async function upsertCategory(seed: CategorySeed, parentId: string | null, order: number): Promise<string> {
  const category = await prisma.category.upsert({
    where: { slug: seed.slug },
    create: { slug: seed.slug, icon: seed.icon, parentId, order, isActive: true },
    update: { parentId, order, isActive: true, ...(seed.icon ? { icon: seed.icon } : {}) },
  });

  await prisma.categoryTranslation.upsert({
    where: { categoryId_locale: { categoryId: category.id, locale: "EN" } },
    create: { categoryId: category.id, locale: "EN", name: seed.nameEn, description: seed.descriptionEn },
    update: { name: seed.nameEn, description: seed.descriptionEn },
  });
  await prisma.categoryTranslation.upsert({
    where: { categoryId_locale: { categoryId: category.id, locale: "AR" } },
    create: { categoryId: category.id, locale: "AR", name: seed.nameAr, description: seed.descriptionAr },
    update: { name: seed.nameAr, description: seed.descriptionAr },
  });

  return category.id;
}

async function main() {
  console.log("Seeding categories...");
  let topOrder = 0;
  for (const cat of CATEGORIES) {
    const parentId = await upsertCategory(cat, null, topOrder++);
    let childOrder = 0;
    for (const child of cat.children ?? []) {
      await upsertCategory(child, parentId, childOrder++);
    }
  }

  console.log("Seeding brands...");
  const brandIdBySlug = new Map<string, string>();
  for (const b of BRANDS) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      create: { slug: b.slug, isActive: true },
      update: { isActive: true },
    });
    brandIdBySlug.set(b.slug, brand.id);
    await prisma.brandTranslation.upsert({
      where: { brandId_locale: { brandId: brand.id, locale: "EN" } },
      create: { brandId: brand.id, locale: "EN", name: b.nameEn, description: b.descriptionEn },
      update: { name: b.nameEn, description: b.descriptionEn },
    });
    await prisma.brandTranslation.upsert({
      where: { brandId_locale: { brandId: brand.id, locale: "AR" } },
      create: { brandId: brand.id, locale: "AR", name: b.nameAr, description: b.descriptionAr },
      update: { name: b.nameAr, description: b.descriptionAr },
    });
  }

  console.log("Seeding products...");
  for (const p of PRODUCTS) {
    const category = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    if (!category) throw new Error(`Category not found for product ${p.sku}: ${p.categorySlug}`);
    const brandId = p.brandSlug ? (brandIdBySlug.get(p.brandSlug) ?? null) : null;

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      create: {
        sku: p.sku,
        slug: p.slug,
        categoryId: category.id,
        brandId,
        temperatureClass: p.temperatureClass,
        originCountry: p.originCountry ?? null,
        weight: p.weight ?? null,
        dimensions: p.dimensions ?? null,
        isPublished: true,
        isFeatured: p.isFeatured ?? false,
      },
      update: {
        categoryId: category.id,
        brandId,
        temperatureClass: p.temperatureClass,
        originCountry: p.originCountry ?? null,
        weight: p.weight ?? null,
        dimensions: p.dimensions ?? null,
        isPublished: true,
        isFeatured: p.isFeatured ?? false,
      },
    });

    await prisma.productTranslation.upsert({
      where: { productId_locale: { productId: product.id, locale: "EN" } },
      create: {
        productId: product.id,
        locale: "EN",
        name: p.nameEn,
        shortDescription: p.shortDescriptionEn,
        description: p.descriptionEn,
        packagingInfo: p.packagingEn,
        storageInfo: p.storageEn,
        ingredients: p.ingredientsEn ?? null,
        nutritionInfo: p.nutritionInfoEn ?? null,
        allergens: p.allergensEn ?? null,
      },
      update: {
        name: p.nameEn,
        shortDescription: p.shortDescriptionEn,
        description: p.descriptionEn,
        packagingInfo: p.packagingEn,
        storageInfo: p.storageEn,
        ingredients: p.ingredientsEn ?? null,
        nutritionInfo: p.nutritionInfoEn ?? null,
        allergens: p.allergensEn ?? null,
      },
    });
    await prisma.productTranslation.upsert({
      where: { productId_locale: { productId: product.id, locale: "AR" } },
      create: {
        productId: product.id,
        locale: "AR",
        name: p.nameAr,
        shortDescription: p.shortDescriptionAr,
        description: p.descriptionAr,
        packagingInfo: p.packagingAr,
        storageInfo: p.storageAr,
        ingredients: p.ingredientsAr ?? null,
        nutritionInfo: p.nutritionInfoAr ?? null,
        allergens: p.allergensAr ?? null,
      },
      update: {
        name: p.nameAr,
        shortDescription: p.shortDescriptionAr,
        description: p.descriptionAr,
        packagingInfo: p.packagingAr,
        storageInfo: p.storageAr,
        ingredients: p.ingredientsAr ?? null,
        nutritionInfo: p.nutritionInfoAr ?? null,
        allergens: p.allergensAr ?? null,
      },
    });
  }

  console.log("Seeding blog categories + posts...");
  const blogCategoryIdByName = new Map<string, string>();
  for (const post of BLOG_POSTS) {
    if (!blogCategoryIdByName.has(post.categoryNameEn)) {
      const slug = post.categoryNameEn.toLowerCase().replace(/\s+/g, "-");
      const arNames: Record<string, string> = {
        "Cold Chain": "سلسلة التبريد",
        Operations: "العمليات",
        Sourcing: "التوريد",
        "Food Safety": "سلامة الغذاء",
      };
      const category = await prisma.blogCategory.upsert({
        where: { slug },
        create: { slug, nameEn: post.categoryNameEn, nameAr: arNames[post.categoryNameEn] ?? post.categoryNameEn },
        update: {},
      });
      blogCategoryIdByName.set(post.categoryNameEn, category.id);
    }
  }

  let publishOffset = 0;
  for (const post of BLOG_POSTS) {
    const categoryId = blogCategoryIdByName.get(post.categoryNameEn) ?? null;
    const publishedAt = new Date(Date.now() - publishOffset * 7 * 24 * 60 * 60 * 1000);
    publishOffset += 1;
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: {
        slug: post.slug,
        titleEn: post.titleEn,
        titleAr: post.titleAr,
        excerptEn: post.excerptEn,
        excerptAr: post.excerptAr,
        contentEn: post.contentEn,
        contentAr: post.contentAr,
        status: "PUBLISHED",
        publishedAt,
        categoryId,
      },
      update: {
        titleEn: post.titleEn,
        titleAr: post.titleAr,
        excerptEn: post.excerptEn,
        excerptAr: post.excerptAr,
        contentEn: post.contentEn,
        contentAr: post.contentAr,
        status: "PUBLISHED",
        categoryId,
      },
    });
  }

  console.log("Seeding FAQs...");
  for (const faq of FAQS) {
    const existing = await prisma.faq.findFirst({ where: { questionEn: faq.questionEn } });
    if (existing) {
      await prisma.faq.update({
        where: { id: existing.id },
        data: { questionAr: faq.questionAr, answerEn: faq.answerEn, answerAr: faq.answerAr, category: faq.category, order: faq.order, isPublished: true },
      });
    } else {
      await prisma.faq.create({
        data: {
          questionEn: faq.questionEn,
          questionAr: faq.questionAr,
          answerEn: faq.answerEn,
          answerAr: faq.answerAr,
          category: faq.category,
          order: faq.order,
          isPublished: true,
        },
      });
    }
  }

  const counts = {
    categories: await prisma.category.count(),
    brands: await prisma.brand.count(),
    products: await prisma.product.count(),
    blogPosts: await prisma.blogPost.count(),
    faqs: await prisma.faq.count(),
  };
  console.log("Done.", counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
