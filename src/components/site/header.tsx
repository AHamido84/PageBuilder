"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { buttonClasses } from "@/components/ui/button";
import { Arrow } from "@/components/ui/arrow";
import { cn } from "@/lib/cn";
import { SOLUTIONS_SEGMENTS } from "@/lib/solutions-segments";

interface CategoryNavItem {
  id: string;
  slug: string;
  name: string;
  children: { id: string; slug: string; name: string }[];
}

interface HeaderProps {
  categories: CategoryNavItem[];
  locale: string;
}

type MegaKey = "products" | "solutions" | "company" | null;

export function SiteHeader({ categories, locale }: HeaderProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMega, setOpenMega] = useState<MegaKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Close any open menu when the route changes — a render-phase state
  // adjustment (not an effect) per React's guidance for resetting state
  // when a prop changes, so it doesn't cause an extra cascading render.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpenMega(null);
    setMobileOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenMega(null);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const solutionsSegments = SOLUTIONS_SEGMENTS;

  const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 border-b border-ink/10 bg-paper/95 backdrop-blur transition-shadow",
        scrolled && "shadow-[var(--shadow-card)]"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-20 lg:px-12">
        <Link href={`/${locale}`} className="font-display shrink-0 text-lg lg:text-xl">
          Seven Eleven Trading
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <MegaButton label={t("products")} active={openMega === "products"} onToggle={() => setOpenMega((k) => (k === "products" ? null : "products"))} />
          <MegaButton label={t("solutions")} active={openMega === "solutions"} onToggle={() => setOpenMega((k) => (k === "solutions" ? null : "solutions"))} />
          <MegaButton label={t("company")} active={openMega === "company"} onToggle={() => setOpenMega((k) => (k === "company" ? null : "company"))} />
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LocaleLinks locale={locale} pathWithoutLocale={pathWithoutLocale} />
          <Link href={`/${locale}/contact`} className={buttonClasses("primary", "sm")}>
            {t("requestQuote")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-ink/15 lg:hidden"
          aria-label={mobileOpen ? "Close" : "Menu"}
          aria-expanded={mobileOpen}
        >
          <span className="relative block h-3 w-4">
            <span className={cn("absolute inset-x-0 top-0 h-[1.5px] bg-ink transition-transform", mobileOpen && "translate-y-[6px] rotate-45")} />
            <span className={cn("absolute inset-x-0 bottom-0 h-[1.5px] bg-ink transition-transform", mobileOpen && "-translate-y-[6px] -rotate-45")} />
          </span>
        </button>
      </div>

      {/* Desktop mega panels */}
      {openMega === "products" && (
        <MegaPanel>
          <div className="grid grid-cols-4 gap-8">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div key={category.id}>
                  <Link href={`/${locale}/products?category=${category.slug}`} className="font-medium hover:text-harbor">
                    {category.name}
                  </Link>
                  {category.children.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <Link href={`/${locale}/products?category=${child.slug}`} className="text-sm text-ink/60 hover:text-harbor">
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="col-span-4 text-sm text-ink/50">No categories yet.</p>
            )}
          </div>
          <div className="mt-6 border-t border-ink/10 pt-4">
            <Link href={`/${locale}/products`} className="text-sm font-medium text-harbor hover:underline">
              {t("viewAllProducts")} <Arrow />
            </Link>
          </div>
        </MegaPanel>
      )}

      {openMega === "solutions" && (
        <MegaPanel>
          <div className="grid grid-cols-4 gap-x-8 gap-y-5">
            {solutionsSegments.map((segment) => (
              <SolutionsLink key={segment.slug} locale={locale} segmentSlug={segment.slug} segmentKey={segment.key} />
            ))}
          </div>
        </MegaPanel>
      )}

      {openMega === "company" && (
        <MegaPanel>
          <div className="grid grid-cols-4 gap-8">
            <Link href={`/${locale}/about`} className="font-medium hover:text-harbor">
              {t("about")}
            </Link>
            <Link href={`/${locale}/quality-food-safety`} className="font-medium hover:text-harbor">
              {t("quality")}
            </Link>
            <Link href={`/${locale}/distribution-logistics`} className="font-medium hover:text-harbor">
              {t("distribution")}
            </Link>
            <Link href={`/${locale}/brands`} className="font-medium hover:text-harbor">
              {t("brands")}
            </Link>
          </div>
        </MegaPanel>
      )}

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="border-t border-ink/10 bg-paper px-5 py-6 lg:hidden">
          <MobileNav categories={categories} locale={locale} solutionsSegments={solutionsSegments} />
        </div>
      ) : null}
    </header>
  );
}

function MegaButton({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-ink text-paper" : "text-ink/80 hover:bg-ink/5"
      )}
      aria-expanded={active}
    >
      {label}
    </button>
  );
}

function MegaPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden border-t border-ink/10 bg-paper lg:block" onClick={(e) => e.stopPropagation()}>
      <div className="mx-auto max-w-[1400px] px-12 py-8">{children}</div>
    </div>
  );
}

function SolutionsLink({ locale, segmentSlug, segmentKey }: { locale: string; segmentSlug: string; segmentKey: string }) {
  const t = useTranslations("solutions");
  return (
    <Link href={`/${locale}/solutions/${segmentSlug}`} className="block">
      <p className="font-medium hover:text-harbor">{t(`${segmentKey}.name`)}</p>
      <p className="mt-1 text-sm text-ink/55">{t(`${segmentKey}.summary`)}</p>
    </Link>
  );
}

function LocaleLinks({ locale, pathWithoutLocale }: { locale: string; pathWithoutLocale: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Link href={`/ar${pathWithoutLocale}`} className={locale === "ar" ? "font-semibold text-ink" : "text-ink/45 hover:text-ink"}>
        AR
      </Link>
      <span className="text-ink/20">/</span>
      <Link href={`/en${pathWithoutLocale}`} className={locale === "en" ? "font-semibold text-ink" : "text-ink/45 hover:text-ink"}>
        EN
      </Link>
    </div>
  );
}

function MobileNav({
  categories,
  locale,
  solutionsSegments,
}: {
  categories: CategoryNavItem[];
  locale: string;
  solutionsSegments: { slug: string; key: string }[];
}) {
  const t = useTranslations("nav");
  const tSolutions = useTranslations("solutions");
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";

  return (
    <div className="space-y-6">
      <div>
        <p className="manifest-strip mb-2 text-ink/40">{t("products")}</p>
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Link href={`/${locale}/products?category=${category.slug}`} className="text-base">
                {category.name}
              </Link>
            </li>
          ))}
          <li>
            <Link href={`/${locale}/products`} className="text-sm font-medium text-harbor">
              {t("viewAllProducts")} <Arrow />
            </Link>
          </li>
        </ul>
      </div>
      <div>
        <p className="manifest-strip mb-2 text-ink/40">{t("solutions")}</p>
        <ul className="space-y-2">
          {solutionsSegments.map((segment) => (
            <li key={segment.slug}>
              <Link href={`/${locale}/solutions/${segment.slug}`} className="text-base">
                {tSolutions(`${segment.key}.name`)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="manifest-strip mb-2 text-ink/40">{t("company")}</p>
        <ul className="space-y-2">
          <li>
            <Link href={`/${locale}/about`} className="text-base">
              {t("about")}
            </Link>
          </li>
          <li>
            <Link href={`/${locale}/quality-food-safety`} className="text-base">
              {t("quality")}
            </Link>
          </li>
          <li>
            <Link href={`/${locale}/distribution-logistics`} className="text-base">
              {t("distribution")}
            </Link>
          </li>
          <li>
            <Link href={`/${locale}/brands`} className="text-base">
              {t("brands")}
            </Link>
          </li>
        </ul>
      </div>
      <div className="flex items-center justify-between border-t border-ink/10 pt-6">
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/ar${pathWithoutLocale}`} className={locale === "ar" ? "font-semibold" : "text-ink/45"}>
            AR
          </Link>
          <span className="text-ink/20">/</span>
          <Link href={`/en${pathWithoutLocale}`} className={locale === "en" ? "font-semibold" : "text-ink/45"}>
            EN
          </Link>
        </div>
        <Link href={`/${locale}/contact`} className={buttonClasses("primary", "sm")}>
          {t("requestQuote")}
        </Link>
      </div>
    </div>
  );
}
