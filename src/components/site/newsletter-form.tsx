"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { subscribeNewsletterAction, type NewsletterState } from "@/app/[locale]/newsletter-actions";
import { buttonClasses } from "@/components/ui/button";

const initialState: NewsletterState = {};

export function NewsletterForm() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(subscribeNewsletterAction, initialState);

  if (state.success) {
    return <p className="text-sm text-wheat">{t("newsletterSuccess")}</p>;
  }

  return (
    <form action={formAction} className="flex gap-2">
      <input type="hidden" name="locale" value={locale.toUpperCase()} />
      <label htmlFor="newsletter-email" className="sr-only">
        {t("newsletterPlaceholder")}
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        dir="ltr"
        required
        placeholder={t("newsletterPlaceholder")}
        className="w-full min-w-0 rounded-[var(--radius-sm)] border border-paper/25 bg-transparent px-3 py-2 text-end text-sm text-paper placeholder:text-paper/40 transition-[border-color,box-shadow] duration-200 focus:border-wheat focus:shadow-[var(--shadow-focus)] focus:outline-none"
      />
      <button type="submit" disabled={pending} className={`${buttonClasses("ghost-light", "sm", "shrink-0")} inline-flex items-center gap-1.5`}>
        {pending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : null}
        {t("newsletterSubmit")}
      </button>
      {state.error ? <p className="text-xs text-signal">{state.error}</p> : null}
    </form>
  );
}
