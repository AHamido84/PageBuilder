"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/ui/toast";
import { setProductsPageBuilderEnabledAction } from "./actions";

/**
 * Public-site switch for the Page Builder products pages (Admin -> Pages: «المنتجات» and «قالب صفحة
 * المنتج»). Instant, no redeploy; off = the built-in pages, exactly as before.
 */
export function ProductsPageToggle({ enabled: initial, envOverride, pages }: { enabled: boolean; envOverride: string | null; pages: { id: string; label: string; status: string }[] }) {
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();
  const toast = useAdminToast();
  const unpublished = pages.filter((p) => p.status !== "PUBLISHED");

  async function toggle() {
    const next = !enabled;
    const ok = await confirm({
      title: next ? "تفعيل صفحات المنتجات من محرر الصفحات؟" : "إيقاف صفحات المنتجات من محرر الصفحات؟",
      description: next
        ? `ستعرض /products وصفحات المنتجات الصفحات المنشورة من محرر الصفحات.${unpublished.length ? " الصفحات غير المنشورة تبقى بالشكل الافتراضي حتى تُنشر." : ""}`
        : "ستعود /products وصفحات المنتجات إلى الشكل الافتراضي فورًا. لا يُحذف شيء.",
      confirmLabel: next ? "تفعيل" : "إيقاف",
      cancelLabel: "إلغاء",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await setProductsPageBuilderEnabledAction(next);
      if (result.error) return toast.push({ title: result.error, tone: "error" });
      setEnabled(next);
      toast.push({ title: next ? "تم التفعيل" : "تم الإيقاف", tone: "success" });
    });
  }

  return (
    <div dir="rtl" className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">صفحات المنتجات من محرر الصفحات</p>
          <p className="text-xs text-neutral-500">
            {enabled ? "مفعّل — /products وصفحات المنتجات من محرر الصفحات (عند نشرها)" : "متوقف — الصفحات الافتراضية"}
            {envOverride ? <span dir="ltr"> · PRODUCTS_PAGE_BUILDER={envOverride} (env override)</span> : null}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={pending}
          onClick={toggle}
          className={`min-h-9 rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${enabled ? "bg-emerald-700 text-white hover:bg-emerald-600" : "border border-neutral-700 text-neutral-200 hover:bg-neutral-800"}`}
        >
          {enabled ? "إيقاف" : "تفعيل"}
        </button>
      </div>
      <ul className="space-y-1 text-xs text-neutral-400">
        {pages.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/pages/${p.id}/builder`} className="text-neutral-200 underline-offset-2 hover:underline">
              {p.label}
            </Link>{" "}
            — {p.status === "PUBLISHED" ? "منشورة" : "غير منشورة (تُعرض فقط في المعاينة)"}
          </li>
        ))}
        {pages.length === 0 ? <li>لم تُنشأ الصفحات بعد (scripts/seed-products-system-pages.ts).</li> : null}
      </ul>
    </div>
  );
}
