"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { buttonClasses } from "@/components/ui/button";
import { Arrow } from "@/components/ui/arrow";
import { EASE_PREMIUM, DURATION } from "@/lib/motion/motionTokens";
import { cn } from "@/lib/cn";
import type { PublicMenuItem } from "@/lib/menus";

interface CategoryNavItem {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  children: { id: string; slug: string; name: string }[];
}

interface FeaturedProductNav {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
}

interface HeaderProps {
  categories: CategoryNavItem[];
  featuredProducts?: FeaturedProductNav[];
  logoUrl?: string | null;
  /** Real admin-managed nav items (from /admin/menus, HEADER location) rendered after "Products". */
  menuItems?: PublicMenuItem[];
  locale: string;
}

type MegaKey = string | null;

export function SiteHeader({ categories, featuredProducts = [], logoUrl, menuItems = [], locale }: HeaderProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMega, setOpenMega] = useState<MegaKey>(null);
  const [hoverMega, setHoverMega] = useState<MegaKey>(null);
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

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMega(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";
  const promoCategory = categories.find((c) => c.imageUrl) ?? null;
  const activeMega = openMega ?? hoverMega;

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-[var(--ease-premium)]",
        scrolled
          ? "border-ink/10 bg-paper/97 shadow-[var(--shadow-card)] backdrop-blur-md"
          : "border-transparent bg-paper/92 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-20 lg:px-12">
        <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Seven Eleven Trading" className="h-8 w-auto lg:h-9" />
          ) : (
            <span className="font-display text-lg leading-none lg:text-xl">Seven Eleven Trading</span>
          )}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" onMouseLeave={() => setHoverMega(null)}>
          <MegaButton
            label={t("products")}
            megaKey="products"
            active={activeMega === "products"}
            open={openMega === "products"}
            onToggle={() => setOpenMega((k) => (k === "products" ? null : "products"))}
            onHover={setHoverMega}
          />
          {menuItems.map((item) =>
            item.children.length > 0 ? (
              <MegaButton
                key={item.id}
                label={item.label}
                megaKey={item.id}
                active={activeMega === item.id}
                open={openMega === item.id}
                onToggle={() => setOpenMega((k) => (k === item.id ? null : item.id))}
                onHover={setHoverMega}
              />
            ) : (
              <Link
                key={item.id}
                href={item.href ?? `/${locale}`}
                className="rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium text-ink/75 transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <LocaleLinks locale={locale} pathWithoutLocale={pathWithoutLocale} />
          <Link href={`/${locale}/contact`} className={buttonClasses("primary", "sm")}>
            {t("requestQuote")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-ink/15 lg:hidden"
          aria-label={mobileOpen ? tCommon("close") : tCommon("menu")}
          aria-expanded={mobileOpen}
        >
          <span className="relative block h-3 w-4">
            <span className={cn("absolute inset-x-0 top-0 h-[1.5px] bg-ink transition-transform duration-200", mobileOpen && "translate-y-[6px] rotate-45")} />
            <span className={cn("absolute inset-x-0 bottom-0 h-[1.5px] bg-ink transition-transform duration-200", mobileOpen && "-translate-y-[6px] -rotate-45")} />
          </span>
        </button>
      </div>

      {/* Desktop mega panels. aria-hidden tracks close *intent* immediately, independent of the
          exit-animation's own DOM-removal timing, so keyboard/screen-reader users can never land
          on links inside a panel that's mid-fade-out after Escape or an outside click. */}
      <div className="hidden lg:block" aria-hidden={!openMega} inert={!openMega} onMouseEnter={() => openMega && setHoverMega(openMega)}>
        <AnimatePresence>
          {openMega === "products" ? (
            <MegaPanel key="products">
              <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-10">
                <div>
                  <p className="manifest-strip mb-4 text-ink/40">{t("products")}</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <div key={category.id}>
                          <Link href={`/${locale}/products?category=${category.slug}`} className="font-medium transition-colors hover:text-harbor">
                            {category.name}
                          </Link>
                          {category.children.length > 0 ? (
                            <ul className="mt-2 space-y-1.5">
                              {category.children.map((child) => (
                                <li key={child.id}>
                                  <Link href={`/${locale}/products?category=${child.slug}`} className="text-sm text-ink/55 transition-colors hover:text-harbor">
                                    {child.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="col-span-2 text-sm text-ink/50">No categories yet.</p>
                    )}
                  </div>
                  <div className="mt-6 border-t border-ink/10 pt-4">
                    <Link href={`/${locale}/products`} className="inline-flex items-center gap-1.5 text-sm font-medium text-harbor hover:underline">
                      {t("viewAllProducts")} <Arrow />
                    </Link>
                  </div>
                </div>

                <div className="border-s border-ink/10 ps-10">
                  <p className="manifest-strip mb-4 text-ink/40">{t("featured")}</p>
                  {featuredProducts.length > 0 ? (
                    <ul className="space-y-4">
                      {featuredProducts.map((product) => (
                        <li key={product.id}>
                          <Link href={`/${locale}/products/${product.slug}`} className="group/fp flex items-center gap-3">
                            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-frost">
                              {product.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={product.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover/fp:scale-110" />
                              ) : null}
                            </span>
                            <span className="text-sm font-medium leading-snug transition-colors group-hover/fp:text-harbor">{product.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink/45">{t("viewAllProducts")}</p>
                  )}
                </div>

                <div
                  className={cn(
                    "flex flex-col justify-between overflow-hidden rounded-[var(--radius-md)] p-6",
                    promoCategory ? "relative bg-ink text-paper" : "border border-wheat/30 bg-wheat-soft text-ink"
                  )}
                >
                  {promoCategory?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={promoCategory.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                  ) : null}
                  <div className="relative">
                    <p className="manifest-strip mb-2 opacity-60">{t("products")}</p>
                    <p className="font-display text-xl leading-tight">
                      {promoCategory ? promoCategory.name : t("discoverProducts")}
                    </p>
                  </div>
                  <Link
                    href={promoCategory ? `/${locale}/products?category=${promoCategory.slug}` : `/${locale}/products`}
                    className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    {t("viewAllProducts")} <Arrow />
                  </Link>
                </div>
              </div>
            </MegaPanel>
          ) : null}

          {menuItems.map((item) =>
            openMega === item.id ? (
              <MegaPanel key={item.id}>
                <div className="grid grid-cols-4 gap-x-8 gap-y-6">
                  {item.children.map((child) => (
                    <Link key={child.id} href={child.href ?? `/${locale}`} className="font-medium transition-colors hover:text-harbor">
                      {child.label}
                    </Link>
                  ))}
                </div>
              </MegaPanel>
            ) : null
          )}
        </AnimatePresence>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.standard, ease: EASE_PREMIUM }}
            className="overflow-hidden border-t border-ink/10 bg-paper lg:hidden"
          >
            <div className="max-h-[calc(100vh-4rem)] overflow-y-auto px-5 py-6">
              <MobileNav categories={categories} locale={locale} menuItems={menuItems} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function MegaButton({
  label,
  megaKey,
  active,
  open,
  onToggle,
  onHover,
}: {
  label: string;
  megaKey: Exclude<MegaKey, null>;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  onHover: (key: MegaKey) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onMouseEnter={() => onHover(megaKey)}
      className={cn("relative rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium transition-colors", open ? "text-ink" : "text-ink/75 hover:text-ink")}
      aria-expanded={open}
    >
      {label}
      {active ? (
        <motion.span
          layoutId="mega-nav-indicator"
          className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-wheat"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      ) : null}
    </button>
  );
}

function MegaPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: DURATION.standard, ease: EASE_PREMIUM }}
      className="border-t border-ink/10 bg-paper"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mx-auto max-w-[1400px] px-12 py-9">{children}</div>
    </motion.div>
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
  menuItems,
}: {
  categories: CategoryNavItem[];
  locale: string;
  menuItems: PublicMenuItem[];
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";

  return (
    <div className="space-y-7">
      <div>
        <p className="manifest-strip mb-3 text-ink/40">{t("products")}</p>
        <ul className="space-y-1">
          {categories.map((category) => (
            <li key={category.id}>
              <Link href={`/${locale}/products?category=${category.slug}`} className="block min-h-11 py-2.5 text-base">
                {category.name}
              </Link>
            </li>
          ))}
          <li>
            <Link href={`/${locale}/products`} className="inline-flex min-h-11 items-center gap-1.5 py-2.5 text-sm font-medium text-harbor">
              {t("viewAllProducts")} <Arrow />
            </Link>
          </li>
        </ul>
      </div>
      {menuItems.map((item) => (
        <div key={item.id}>
          <p className="manifest-strip mb-3 text-ink/40">{item.label}</p>
          {item.children.length > 0 ? (
            <ul className="space-y-1">
              {item.children.map((child) => (
                <li key={child.id}>
                  <Link href={child.href ?? `/${locale}`} className="block min-h-11 py-2.5 text-base">
                    {child.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Link href={item.href ?? `/${locale}`} className="block min-h-11 py-2.5 text-base">
              {item.label}
            </Link>
          )}
        </div>
      ))}
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
