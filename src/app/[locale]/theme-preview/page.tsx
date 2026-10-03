import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClasses, type ButtonVariant } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Theme preview", robots: { index: false, follow: false } };

/**
 * Style guide for the admin Appearance page's live preview (it's loaded in an iframe there). Built
 * from the site's real components and classes inside the real public layout, so it shows exactly
 * how theme settings land -- every button style with its hover state, card recipes, type scale,
 * radii, shadows and spacing. Admin-only and noindex; anyone else gets a 404.
 */
export default async function ThemePreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const user = await getCurrentUser();
  if (!can(user, "settings", "read")) notFound();
  const { locale } = await params;
  const ar = locale === "ar";
  const t = (en: string, arText: string) => (ar ? arText : en);

  const buttons: { variant: ButtonVariant; label: string; cssVar: string }[] = [
    { variant: "primary", label: t("Primary", "أساسي"), cssVar: "primary" },
    { variant: "secondary", label: t("Secondary", "ثانوي"), cssVar: "secondary" },
    { variant: "gold", label: t("Gold", "ذهبي"), cssVar: "gold" },
    { variant: "ghost-gold", label: t("Ghost gold", "ذهبي مفرغ"), cssVar: "ghost-gold" },
  ];
  const swatches = [
    ["Primary", "--color-primary"],
    ["Secondary", "--color-secondary"],
    ["Accent", "--color-accent"],
    ["Gold", "--color-gold"],
    ["Background", "--color-background"],
    ["Surface", "--color-surface"],
    ["Text", "--color-text"],
    ["Muted text", "--color-muted-text"],
    ["Border", "--color-border"],
  ] as const;

  return (
    <div className="bg-paper text-ink">
      <Container className="space-y-16 py-14">
        <section className="space-y-4">
          <p className="manifest-strip text-harbor">{t("Typography", "الخطوط")}</p>
          <h1 className="font-display text-display">{t("Taste worthy of your hospitality", "مذاق يليق بضيافتك")}</h1>
          <h2 className="font-display text-h1">{t("Heading one — premium frozen foods", "عنوان أول — أغذية مجمدة مميزة")}</h2>
          <h3 className="font-display text-h2">{t("Heading two — sourcing to your dock", "عنوان ثانٍ — من المصدر إلى مستودعك")}</h3>
          <h4 className="font-display text-h3">{t("Heading three — cold-chain handling", "عنوان ثالث — سلسلة التبريد")}</h4>
          <p className="text-body max-w-2xl">
            {t(
              "Body text. A general trading company built around one core business: food. We supply restaurants, hotels and cafés with products and supply options that fit how your kitchen actually works.",
              "نص أساسي. شركة تجارة عامة قائمة على نشاط أساسي واحد: الغذاء. نوفر المنتجات الغذائية للمطاعم والفنادق والمقاهي مع خيارات توريد تناسب احتياجات أعمالك."
            )}
          </p>
          <p className="max-w-2xl text-[color:var(--color-muted-text)]">{t("Muted text for captions and secondary details.", "نص ثانوي للتعليقات والتفاصيل الإضافية.")}</p>
          <p>
            <a href="#" className="text-harbor underline underline-offset-4">
              {t("An accent-colored link", "رابط بلون مميز")}
            </a>
          </p>
        </section>

        <section className="space-y-4">
          <p className="manifest-strip text-harbor">{t("Colors", "الألوان")}</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {swatches.map(([label, cssVar]) => (
              <div key={cssVar} className="space-y-1.5">
                <div className="h-14 rounded-[var(--card-radius)] border border-line" style={{ background: `var(${cssVar})` }} />
                <p className="text-xs">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <p className="manifest-strip text-harbor">{t("Buttons", "الأزرار")}</p>
          <div className="space-y-3">
            {buttons.map((b) => (
              <div key={b.variant} className="flex flex-wrap items-center gap-3">
                <span className="w-28 text-xs text-[color:var(--color-muted-text)]">{b.label}</span>
                <button type="button" className={buttonClasses(b.variant, "sm")}>
                  {t("Request a quote", "اطلب عرض سعر")}
                </button>
                <button type="button" className={buttonClasses(b.variant, "md")}>
                  {t("Request a quote", "اطلب عرض سعر")}
                </button>
                <button type="button" className={buttonClasses(b.variant, "lg")}>
                  {t("Request a quote", "اطلب عرض سعر")}
                </button>
                {/* Static stand-in for the hover state, which a preview can't trigger on its own. */}
                <span
                  className={buttonClasses(b.variant, "md", "pointer-events-none")}
                  style={{ background: `var(--btn-${b.cssVar}-hover-bg)`, color: `var(--btn-${b.cssVar}-hover-text)` }}
                >
                  {t("Hover", "عند التمرير")}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <p className="manifest-strip text-harbor">{t("Cards, images & spacing", "البطاقات والصور والمسافات")}</p>
          <div className="grid gap-[var(--card-gap)] sm:grid-cols-3">
            {(["product", "default", "solution"] as const).map((variant) => (
              <Card key={variant} variant={variant} className="overflow-hidden p-0">
                <div className="aspect-[4/3] bg-[linear-gradient(135deg,var(--color-petrol),var(--color-harbor)_55%,var(--color-wheat))]" />
                <div className="space-y-2 p-5">
                  <Badge tone="wheat">{t("Frozen", "مجمد")}</Badge>
                  <p className="font-display text-h4">{t("Golden fries 7mm", "بطاطس ذهبية ٧ مم")}</p>
                  <p className="text-sm text-[color:var(--color-muted-text)]">{t(`${variant} card · 2.5 kg`, `بطاقة ${variant} · ٢٫٥ كجم`)}</p>
                </div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-[var(--grid-gap)] sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-[var(--image-radius-lg)] bg-[linear-gradient(160deg,var(--color-frost),var(--color-harbor))]" />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <p className="manifest-strip text-harbor">{t("Shadows", "الظلال")}</p>
          <div className="grid gap-[var(--card-gap)] sm:grid-cols-3">
            {(
              [
                ["Soft", "--shadow-flat"],
                ["Medium", "--shadow-card"],
                ["Strong", "--shadow-lifted"],
              ] as const
            ).map(([label, cssVar]) => (
              <div key={cssVar} className="rounded-[var(--card-radius-lg)] bg-paper p-8 text-sm" style={{ boxShadow: `var(${cssVar})` }}>
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="section-radius-default border-t border-line bg-petrol p-10 text-paper sm:p-14">
          <p className="manifest-strip text-wheat">{t("Section", "قسم")}</p>
          <p className="mt-3 font-display text-h2">{t("Let's start a partnership", "خلّنا نبدأ شراكة بطعم مميز")}</p>
          <p className="mt-3 max-w-xl opacity-80">{t("A brand-colored section using the section radius.", "قسم بلون العلامة يستخدم زوايا الأقسام.")}</p>
          <button type="button" className={buttonClasses("gold", "md", "mt-6")}>
            {t("Request a quote", "اطلب عرض سعر")}
          </button>
        </section>
      </Container>
    </div>
  );
}
