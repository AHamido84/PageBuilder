"use client";

import { useState } from "react";
import { slugifyKey, type OptionDisplay } from "@/lib/catalog/variants/core";
import { saveOptionTypeAction } from "@/app/admin/(dashboard)/options/actions";

export const DISPLAY_LABELS: Record<OptionDisplay, string> = {
  PILL: "أزرار",
  SWATCH: "ألوان",
  IMAGE: "صور",
  SELECT: "قائمة منسدلة",
};

export interface OptionTypeRow {
  id: string;
  key: string;
  labelAr: string;
  labelEn: string;
  display: OptionDisplay;
}

export const adminInput =
  "w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400";
export const adminLabel = "mb-1 block text-xs text-neutral-400";
export const fieldError = "mt-1 text-xs text-red-400";

/**
 * Create / edit one global option type. Used by /admin/options and inline from the product editor
 * («+ إنشاء خيار جديد»). The key is suggested from the English label and stays editable.
 */
export function OptionTypeForm({
  initial,
  onSaved,
  onCancel,
  submitLabel = "حفظ الخيار",
}: {
  initial?: OptionTypeRow;
  onSaved: (row: OptionTypeRow) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [labelAr, setLabelAr] = useState(initial?.labelAr ?? "");
  const [labelEn, setLabelEn] = useState(initial?.labelEn ?? "");
  const [key, setKey] = useState(initial?.key ?? "");
  const [keyTouched, setKeyTouched] = useState(Boolean(initial));
  const [display, setDisplay] = useState<OptionDisplay>(initial?.display ?? "PILL");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError(null);
    const result = await saveOptionTypeAction({ id: initial?.id ?? null, key, labelAr, labelEn, display });
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setError(result.error ?? "تعذر الحفظ");
      return;
    }
    setErrors({});
    onSaved({ id: result.id!, key: result.key!, labelAr: labelAr.trim(), labelEn: labelEn.trim(), display });
  }

  return (
    // Not a <form>: it is also rendered inside the product editor, which is itself inside a page form tree.
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}>
      <div>
        <label className={adminLabel}>الاسم بالعربية</label>
        <input value={labelAr} onChange={(e) => setLabelAr(e.target.value)} className={adminInput} placeholder="مثال: نوع التقطيع" />
        {errors.labelAr ? <p className={fieldError}>{errors.labelAr}</p> : null}
      </div>
      <div>
        <label className={adminLabel}>Name (English)</label>
        <input
          dir="ltr"
          value={labelEn}
          onChange={(e) => {
            setLabelEn(e.target.value);
            if (!keyTouched) setKey(slugifyKey(e.target.value));
          }}
          className={adminInput}
          placeholder="e.g. Cut style"
        />
        {errors.labelEn ? <p className={fieldError}>{errors.labelEn}</p> : null}
      </div>
      <div>
        <label className={adminLabel}>المفتاح (يظهر في الرابط)</label>
        <input
          dir="ltr"
          value={key}
          onChange={(e) => {
            setKeyTouched(true);
            setKey(e.target.value.toLowerCase());
          }}
          className={`${adminInput} font-mono`}
          placeholder="cut-style"
        />
        {errors.key ? <p className={fieldError}>{errors.key}</p> : null}
      </div>
      <div>
        <label className={adminLabel}>طريقة العرض</label>
        <select value={display} onChange={(e) => setDisplay(e.target.value as OptionDisplay)} className={adminInput}>
          {(Object.keys(DISPLAY_LABELS) as OptionDisplay[]).map((d) => (
            <option key={d} value={d}>
              {DISPLAY_LABELS[d]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 sm:col-span-4">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="min-h-9 rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
        >
          {pending ? "جارٍ الحفظ…" : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="min-h-9 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800">
            إلغاء
          </button>
        ) : null}
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
