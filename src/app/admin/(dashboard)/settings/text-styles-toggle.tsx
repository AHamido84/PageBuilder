"use client";

import { useState, useTransition } from "react";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/ui/toast";
import { setTextStylesEnabledAction } from "./actions";

/** Public-site switch for admin text styling (color / size / bold / italic). Instant, no redeploy. */
export function TextStylesToggle({ enabled: initial, envOverride }: { enabled: boolean; envOverride: string | null }) {
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();
  const toast = useAdminToast();

  async function toggle() {
    const next = !enabled;
    const ok = await confirm({
      title: next ? "تفعيل تنسيق النصوص في الموقع؟" : "إيقاف تنسيق النصوص في الموقع؟",
      description: next
        ? "ستظهر الألوان والأحجام والخط العريض والمائل التي حددتها في لوحة التحكم."
        : "سيعرض الموقع كل النصوص بالشكل الافتراضي فورًا. التنسيقات المحفوظة لا تُحذف.",
      confirmLabel: next ? "تفعيل" : "إيقاف",
      cancelLabel: "إلغاء",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await setTextStylesEnabledAction(next);
      if (result.error) return toast.push({ title: result.error, tone: "error" });
      setEnabled(next);
      toast.push({ title: next ? "تم تفعيل تنسيق النصوص" : "تم إيقاف تنسيق النصوص", tone: "success" });
    });
  }

  return (
    <div dir="rtl" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div>
        <p className="text-sm font-medium">تنسيق النصوص في الموقع العام</p>
        <p className="text-xs text-neutral-500">
          {enabled ? "مفعّل — تظهر الألوان والأحجام المحددة" : "متوقف — كل النصوص بالشكل الافتراضي"}
          {envOverride ? <span dir="ltr"> · TEXT_STYLES_ENABLED={envOverride} (env override)</span> : null}
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
  );
}
