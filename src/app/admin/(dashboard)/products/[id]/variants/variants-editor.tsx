"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AbstractIntlMessages } from "next-intl";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/ui/toast";
import type { OptionTypeRow } from "@/components/admin/variants/option-type-form";
import { saveProductVariantsAction } from "../../variant-actions";
import { OptionsSection } from "./options-section";
import { VariantsTable } from "./variants-table";
import { VariantsPreview } from "./variants-preview";
import { reviewIssues, toPayload, toPreviewView, variantFromLegacy, type EditorState, type LegacyFields } from "./editor-state";

/**
 * Admin product screen, «الأنواع» tab: product type toggle (منتج بسيط / منتج بأنواع), options,
 * variants matrix, live preview, and save as draft / publish -- one server action, one transaction.
 * Arabic RTL with the English field next to each Arabic one.
 */
export function VariantsEditor({
  product,
  initial,
  legacy,
  library: initialLibrary,
  canPublish,
  previewMessages,
}: {
  product: { id: string; slug: string; sku: string; temperatureClass: string; nameAr: string; categoryNameAr: string; isPublished: boolean; isFeatured: boolean };
  initial: EditorState;
  legacy: LegacyFields;
  library: OptionTypeRow[];
  canPublish: boolean;
  previewMessages: AbstractIntlMessages;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useAdminToast();
  const [state, setState] = useState<EditorState>(initial);
  const [library, setLibrary] = useState(initialLibrary);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initial));
  const dirty = JSON.stringify(state) !== savedSnapshot;

  // Unsaved changes: warn on reload/close, and on in-app link clicks.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank" || e.defaultPrevented) return;
      if (!window.confirm("لديك تغييرات غير محفوظة في الأنواع. مغادرة الصفحة بدون حفظ؟")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const update = (fn: (s: EditorState) => EditorState) => setState(fn);
  const preview = useMemo(() => toPreviewView(state, product.nameAr, legacy), [state, product.nameAr, legacy]);
  const issues = reviewIssues(state);

  async function switchType(type: EditorState["type"]) {
    if (type === state.type) return;
    if (type === "SIMPLE") {
      if (state.variants.length > 0) {
        const ok = await confirm({
          title: "تحويل إلى منتج بسيط؟",
          description: `عند الحفظ ستُحذف الخيارات و${state.variants.length} نوع، ويعود المنتج للعرض من بياناته الأساسية (الصور والوزن في تبويبات «Media» و«Specifications»).`,
          confirmLabel: "تحويل",
          cancelLabel: "إلغاء",
          danger: true,
        });
        if (!ok) return;
      }
      setState((s) => ({ ...s, type: "SIMPLE" }));
      return;
    }
    // To a variant product: the current product data (if any) becomes the first variant -- nothing is
    // lost; «توليد الأنواع» then gives it the first combination.
    setState((s) => {
      const hasLegacy = legacy.images.length > 0 || Boolean(legacy.weight || legacy.packagingAr || legacy.packagingEn || legacy.storageAr || legacy.storageEn);
      if (s.variants.length || !hasLegacy) return { ...s, type: "VARIANT" };
      const first = variantFromLegacy(legacy);
      return { ...s, type: "VARIANT", variants: [first], defaultClientId: first.clientId };
    });
  }

  async function save(publish: boolean | undefined) {
    if (issues.size) {
      setFormError(`${issues.size} نوع يحتاج مراجعة (مظلل بالأصفر) — أصلح التركيبات أو احذفها قبل الحفظ.`);
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = toPayload(product.id, state.type === "SIMPLE" ? { ...state, options: [], variants: [] } : state, publish);
    const result = await saveProductVariantsAction(payload);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error ?? "تعذر الحفظ");
      toast.push({ title: result.error ?? "تعذر الحفظ", tone: "error" });
      requestAnimationFrame(() => document.querySelector("[data-variants-editor] .text-red-400")?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }
    setErrors({});
    setSavedSnapshot(JSON.stringify(state));
    toast.push({ title: publish === true ? "تم الحفظ والنشر" : publish === false ? "تم الحفظ كمسودة" : "تم الحفظ", tone: "success" });
    router.refresh();
  }

  return (
    <div dir="rtl" lang="ar" className="space-y-5" data-variants-editor>
      <section className="flex flex-wrap items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <div role="radiogroup" aria-label="نوع المنتج" className="inline-flex rounded-md border border-neutral-700 p-0.5">
          {(
            [
              ["SIMPLE", "منتج بسيط"],
              ["VARIANT", "منتج بأنواع"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={state.type === value}
              onClick={() => switchType(value)}
              className={`min-h-9 rounded px-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${state.type === value ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-300 hover:bg-neutral-800"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-500">
          {state.type === "SIMPLE"
            ? "منتج واحد كما هو اليوم — الصور والوزن والتعبئة من تبويبات Media وSpecifications."
            : "منتج رئيسي يحتوي أنواعًا تختلف بخيارات مثل المقاس أو الوزن أو القطعية."}
        </p>
        <span className={`ms-auto rounded px-2 py-0.5 text-xs ${product.isPublished ? "bg-emerald-950 text-emerald-300" : "bg-neutral-800 text-neutral-400"}`}>
          {product.isPublished ? "منشور" : "مسودة"}
        </span>
      </section>

      {state.type === "VARIANT" ? (
        <>
          <OptionsSection state={state} update={update} library={library} onLibraryAdd={(row) => setLibrary((l) => [...l, row])} errors={errors} />
          <VariantsTable state={state} update={update} errors={errors} />
        </>
      ) : null}

      <VariantsPreview
        view={preview}
        messages={previewMessages}
        card={{ id: product.id, slug: product.slug, sku: product.sku, temperatureClass: product.temperatureClass, name: product.nameAr, categoryName: product.categoryNameAr, isFeatured: product.isFeatured }}
      />

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 border-t border-neutral-800 bg-neutral-950/95 py-3 backdrop-blur">
        <button type="button" disabled={saving || !dirty} onClick={() => save(undefined)} className="min-h-9 rounded-md bg-neutral-100 px-4 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-40" data-testid="variants-save">
          {saving ? "جارٍ الحفظ…" : "حفظ"}
        </button>
        {canPublish ? (
          <>
            <button type="button" disabled={saving} onClick={() => save(false)} className="min-h-9 rounded-md border border-neutral-700 px-4 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-40">
              حفظ كمسودة
            </button>
            <button type="button" disabled={saving} onClick={() => save(true)} className="min-h-9 rounded-md bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-40" data-testid="variants-publish">
              حفظ ونشر
            </button>
          </>
        ) : null}
        {dirty ? <span className="text-xs text-amber-300">تغييرات غير محفوظة</span> : <span className="text-xs text-neutral-500">لا توجد تغييرات</span>}
        {formError ? (
          <p role="alert" className="w-full text-sm text-red-400">
            {formError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
