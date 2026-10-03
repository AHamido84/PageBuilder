"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CmsFillImage } from "@/components/media/cms-image";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Arrow } from "@/components/ui/arrow";
import { RouteLine } from "@/components/site/graphics/route-line";
import { EASE_PREMIUM, DURATION } from "@/lib/motion/motionTokens";
import { cn } from "@/lib/cn";
import type { PublicMenuItem } from "@/lib/menus";
import { resolveLogoObjectPosition, type HeaderLogoLocaleSettings } from "@/lib/site-settings/header-logo";

/** Matches the accent used on CATEGORY_GRID's no-image card fallback — same graphic language, different scale. */
const PROMO_ACCENT_PATH = "M4 32 Q 36 4 68 32";

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
  /** Admin-configurable logo box size/alignment/behavior (Settings > General), already resolved to
   * this page's locale by the caller -- see src/lib/site-settings/header-logo.ts. */
  logoSettings: HeaderLogoLocaleSettings;
  /** Real admin-managed nav items (from /admin/menus, HEADER location) rendered after "Products". */
  menuItems?: PublicMenuItem[];
  locale: string;
}

type MegaKey = string | null;

/** Golden Seven home v7 header styles (design 01). */
const NAV_LINK =
  "g7-t26 rounded-[6px] px-3 py-2 text-[var(--g7-teal-900)] transition-colors hover:text-[var(--g7-gold-600)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g7-gold-500)]";
const CONTACT_BUTTON =
  "inline-flex h-[clamp(2.75rem,3.3vw,3.95rem)] min-w-[clamp(9rem,11.6vw,13.9rem)] items-center justify-center rounded-[6px] bg-[var(--g7-gold-600)] px-6 text-[clamp(1.1875rem,1.35vw,1.625rem)] font-bold text-[var(--g7-cream-50)] transition-colors hover:bg-[#98691d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g7-teal-900)]";

export function SiteHeader({
  categories,
  featuredProducts = [],
  logoUrl,
  logoSettings,
  menuItems = [],
  locale,
}: HeaderProps) {
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

  // Root-cause RTL fix: "start"/"end" are logical -- they must resolve against the page's actual
  // `dir`, not a hardcoded physical value, or Arabic silently gets the English-flavored side. See
  // src/lib/site-settings/header-logo.ts for why this used to be wrong.
  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";
  const logoObjectPosition = resolveLogoObjectPosition(logoSettings.align, dir);
  const logoWidthDesktop = logoSettings.widthDesktop ?? Math.round(logoSettings.heightDesktop * 3.2);
  const logoWidthMobile = logoSettings.widthMobile ?? Math.round(logoSettings.heightMobile * 3.2);
  const showLogo = Boolean(logoUrl) && !logoSettings.hidden;

  return (
    <header
      ref={headerRef}
      className={cn(
        "top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-[var(--ease-premium)]",
        logoSettings.sticky && "sticky",
        scrolled
          ? "border-[var(--g7-divider)] bg-[var(--g7-cream-50)] shadow-[0_1px_0_rgba(15,65,76,0.06)]"
          : "border-transparent bg-[var(--g7-cream-50)]"
      )}
    >
      <div className="g7-container flex h-[clamp(4.5rem,7.3vw,8.75rem)] items-center justify-between gap-4">
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-2.5"
          style={{ marginInlineEnd: `${logoSettings.spacing}px` }}
        >
          {showLogo ? (
            // Fixed-box + fill + object-contain: renders at a genuinely large, sharp size (was
            // capped at h-8/h-9 -- a barely-visible thumbnail) while never distorting or cropping
            // whatever aspect ratio the admin's uploaded logo actually has. next/image (not a plain
            // <img>) gives it the optimization pipeline (responsive srcset, priority preload since
            // this is above-the-fold/LCP-adjacent) the rest of the site's imagery already gets.
            // Height/width come from admin-configurable, per-locale SiteSetting fields (Settings >
            // General), via CSS custom properties -- Tailwind arbitrary-value classes (`h-[var(--x)]`)
            // still scan as literal source text, so this doesn't hit the runtime-concatenation JIT
            // pitfall documented in style-tokens.ts, while still letting the *value* be fully dynamic
            // per breakpoint. object-contain never stretches or crops the image regardless of how the
            // configured box's aspect ratio compares to the logo's own.
            <span
              className="relative block h-[var(--logo-h-mobile)] w-[var(--logo-w-mobile)] shrink-0 lg:h-[var(--logo-h-desktop)] lg:w-[var(--logo-w-desktop)]"
              style={
                {
                  "--logo-h-mobile": `${logoSettings.heightMobile}px`,
                  "--logo-h-desktop": `${logoSettings.heightDesktop}px`,
                  "--logo-w-mobile": `${logoWidthMobile}px`,
                  "--logo-w-desktop": `${logoWidthDesktop}px`,
                  maxWidth: logoSettings.maxWidth ? `${logoSettings.maxWidth}px` : undefined,
                } as React.CSSProperties
              }
            >
              <CmsFillImage
                src={logoUrl!}
                alt="Seven Eleven Trading"
                priority
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 240px, 200px"
                className="object-contain"
                style={{ objectPosition: logoObjectPosition }}
                context={{ component: "SiteHeader logo", locale }}
              />
            </span>
          ) : (
            <span className="font-display text-lg leading-none lg:text-xl">Seven Eleven Trading</span>
          )}
        </Link>

        <nav className="hidden items-center gap-[clamp(0.25rem,2.6vw,3.2rem)] lg:flex" onMouseLeave={() => setHoverMega(null)}>
          <Link
            href={`/${locale}`}
            aria-current={pathWithoutLocale === "/" ? "page" : undefined}
            className={cn(NAV_LINK, pathWithoutLocale === "/" && "text-[var(--g7-gold-600)]")}
          >
            {t("home")}
          </Link>
          <MegaButton
            label={t("productsMenu")}
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
                className={NAV_LINK}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-[clamp(1.5rem,5.6vw,6.75rem)] lg:flex">
          <Link href={`/${locale}/contact`} className={CONTACT_BUTTON}>
            {t("contact")}
          </Link>
          <LocaleLinks locale={locale} pathWithoutLocale={pathWithoutLocale} />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-[var(--g7-teal-900)]/25 text-[var(--g7-teal-900)] lg:hidden"
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
                  <div className="mt-6 border-t border-line pt-4">
                    <Link href={`/${locale}/products`} className="inline-flex items-center gap-1.5 text-sm font-medium text-harbor hover:underline">
                      {t("viewAllProducts")} <Arrow />
                    </Link>
                  </div>
                </div>

                <div className="border-s border-line ps-10">
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
                    "relative flex flex-col justify-between overflow-hidden rounded-[var(--radius-md)] p-6",
                    promoCategory ? "bg-ink text-paper" : "bg-grid-fine border border-current/10 bg-frost text-ink"
                  )}
                >
                  {promoCategory?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={promoCategory.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                  ) : (
                    <RouteLine d={PROMO_ACCENT_PATH} viewBox="0 0 72 36" strokeWidth={1.5} className="h-9 w-[4.5rem] text-harbor/50" />
                  )}
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
            className="overflow-hidden border-t border-line bg-paper lg:hidden"
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
      className={cn(NAV_LINK, "relative", open && "text-[var(--g7-gold-600)]")}
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
      className="border-t border-line bg-paper"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mx-auto max-w-[1400px] px-12 py-9">{children}</div>
    </motion.div>
  );
}

function LocaleLinks({ locale, pathWithoutLocale }: { locale: string; pathWithoutLocale: string }) {
  // Design 01: "AR  EN", active language dark teal, the other muted. Always LTR order.
  return (
    <div dir="ltr" className="g7-t26 flex items-center gap-[clamp(1rem,2vw,2.5rem)]">
      <Link href={`/ar${pathWithoutLocale}`} hrefLang="ar" lang="ar" aria-current={locale === "ar" ? "true" : undefined} className={locale === "ar" ? "font-medium text-[var(--g7-teal-900)]" : "text-[var(--g7-muted)] hover:text-[var(--g7-teal-900)]"}>
        AR
      </Link>
      <Link href={`/en${pathWithoutLocale}`} hrefLang="en" lang="en" aria-current={locale === "en" ? "true" : undefined} className={locale === "en" ? "font-medium text-[var(--g7-teal-900)]" : "text-[var(--g7-muted)] hover:text-[var(--g7-teal-900)]"}>
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
      <Link href={`/${locale}`} className="block min-h-11 py-2.5 text-lg text-[var(--g7-teal-900)]">
        {t("home")}
      </Link>
      <div>
        <p className="manifest-strip mb-3 text-ink/40">{t("productsMenu")}</p>
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
      <div className="flex items-center justify-between border-t border-line pt-6">
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/ar${pathWithoutLocale}`} className={locale === "ar" ? "font-semibold" : "text-ink/45"}>
            AR
          </Link>
          <span className="text-ink/20">/</span>
          <Link href={`/en${pathWithoutLocale}`} className={locale === "en" ? "font-semibold" : "text-ink/45"}>
            EN
          </Link>
        </div>
        <Link href={`/${locale}/contact`} className={CONTACT_BUTTON}>
          {t("contact")}
        </Link>
      </div>
    </div>
  );
}
