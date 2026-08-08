"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const pathname = usePathname();
  const activeLocale = useLocale();

  const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";

  return (
    <div className="flex gap-2 text-sm">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${pathWithoutLocale}`}
          className={locale === activeLocale ? "font-semibold text-neutral-100" : "text-neutral-500 hover:text-neutral-300"}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
