import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ContactForm } from "./contact-form";
import { LocaleSwitcher } from "./locale-switcher";

export const dynamic = "force-dynamic";

async function getCategories(locale: string) {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { order: "asc" },
    include: { translations: true },
    take: 12,
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name:
      category.translations.find((t) => t.locale === locale.toUpperCase())?.name ??
      category.translations[0]?.name ??
      category.slug,
  }));
}

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const categories = await getCategories(locale);

  return (
    <div className="flex flex-1 flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-900 px-6 py-4">
        <span className="text-sm font-semibold">Seven Eleven Trading</span>
        <LocaleSwitcher />
      </header>

      <section className="border-b border-neutral-900 px-6 py-24 text-center">
        <p className="mb-3 text-sm text-neutral-400">{t("heroEyebrow")}</p>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight sm:text-5xl">{t("heroTitle")}</h1>
        <p className="mx-auto max-w-2xl text-neutral-400">{t("heroSubtitle")}</p>
      </section>

      <section className="border-b border-neutral-900 px-6 py-16">
        <h2 className="mb-6 text-center text-lg font-medium">{t("productsHeading")}</h2>
        {categories.length > 0 ? (
          <ul className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((category) => (
              <li key={category.id} className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-center text-sm">
                {category.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-sm text-neutral-500">{t("noProducts")}</p>
        )}
      </section>

      <section className="px-6 py-16">
        <h2 className="mb-2 text-center text-lg font-medium">{t("contactHeading")}</h2>
        <p className="mx-auto mb-8 max-w-md text-center text-sm text-neutral-400">{t("contactSubheading")}</p>
        <ContactForm />
      </section>
    </div>
  );
}
