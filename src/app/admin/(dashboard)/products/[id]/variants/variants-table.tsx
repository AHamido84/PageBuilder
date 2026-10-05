"use client";

import { Fragment, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Trash2, X } from "lucide-react";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { MultiMediaPickerButton, type MediaListItem } from "@/components/admin/ui/media-library-modal";
import { adminInput, adminLabel, fieldError } from "@/components/admin/variants/option-type-form";
import { StyledTextField } from "@/components/admin/text/styled-text-field";
import { setRich } from "@/lib/text-style/rich-text";
import { comboKey, generateCombinations, mergeGeneratedCombinations } from "@/lib/catalog/variants/core";
import { ORPHAN_TEXT, arLabel, emptyVariant, optionShape, reviewIssues, uid, type EditorImage, type EditorState, type EditorVariant } from "./editor-state";

const toImages = (items: MediaListItem[]): EditorImage[] =>
  items.map((m) => ({ uid: uid("i"), url: m.url, mediaId: m.id, altAr: m.altTextAr ?? "", altEn: m.altTextEn ?? "" }));

export function VariantsTable({
  state,
  update,
  errors,
}: {
  state: EditorState;
  update: (fn: (s: EditorState) => EditorState) => void;
  errors: Record<string, string>;
}) {
  const confirm = useConfirm();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const issues = reviewIssues(state);
  const shape = optionShape(state.options);

  function setVariant(clientId: string, patch: Partial<EditorVariant>) {
    update((s) => ({ ...s, variants: s.variants.map((v) => (v.clientId === clientId ? { ...v, ...patch } : v)) }));
  }

  function generate() {
    if (state.options.some((o) => o.values.length === 0)) {
      setNotice("أضف قيمة واحدة على الأقل لكل خيار قبل التوليد.");
      return;
    }
    // A variant with no combination yet (the product's own data, kept when it became a variant
    // product) takes the first free combination instead of being flagged.
    const taken = new Set(state.variants.filter((v) => Object.keys(v.options).length).map((v) => comboKey(v.options)));
    const free = generateCombinations(shape).filter((c) => !taken.has(comboKey(c)));
    const seeded = state.variants.map((v) => (Object.keys(v.options).length === 0 && free.length ? { ...v, options: free.shift()! } : v));
    const result = mergeGeneratedCombinations(shape, seeded, (options) => emptyVariant(options));
    update((s) => ({ ...s, variants: result.variants, defaultClientId: s.defaultClientId ?? result.variants[0]?.clientId ?? null }));
    setNotice(
      `${result.added ? `أُضيف ${result.added} نوع جديد.` : "لا توجد تركيبات جديدة."}${result.orphans.length ? ` ${result.orphans.length} نوع يحتاج مراجعة (مظلل).` : ""} احذف التركيبات غير الموجودة فعليًا.`
    );
  }

  function addManual() {
    const variant = emptyVariant(Object.fromEntries(state.options.filter((o) => o.values[0]).map((o) => [o.key, o.values[0].key])));
    update((s) => ({ ...s, variants: [...s.variants, variant], defaultClientId: s.defaultClientId ?? variant.clientId }));
    setExpanded((e) => new Set(e).add(variant.clientId));
  }

  async function removeVariants(ids: string[]) {
    const names = state.variants.filter((v) => ids.includes(v.clientId)).map((v) => arLabel(state.options, v.options) || "النوع");
    const ok = await confirm({
      title: ids.length === 1 ? `حذف «${names[0]}»؟` : `حذف ${ids.length} أنواع؟`,
      description: "سيُحذف النوع وصوره ومواصفاته عند الحفظ. يمكنك التراجع بعدم الحفظ وإعادة تحميل الصفحة.",
      confirmLabel: "حذف",
      cancelLabel: "إلغاء",
      danger: true,
    });
    if (!ok) return;
    update((s) => {
      const variants = s.variants.filter((v) => !ids.includes(v.clientId));
      const defaultClientId = s.defaultClientId && ids.includes(s.defaultClientId) ? (variants[0]?.clientId ?? null) : s.defaultClientId;
      return { ...s, variants, defaultClientId };
    });
    setSelected((sel) => new Set([...sel].filter((id) => !ids.includes(id))));
  }

  const allSelected = state.variants.length > 0 && state.variants.every((v) => selected.has(v.clientId));
  const rowErrors = (i: number) =>
    Object.entries(errors)
      .filter(([path]) => path === `variants.${i}` || path.startsWith(`variants.${i}.`))
      .map(([path, msg]) => ({ path: path.slice(`variants.${i}`.length + 1), msg }));

  return (
    <section aria-labelledby="variants-table-title" className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 id="variants-table-title" className="me-auto text-base font-semibold">
          الأنواع <span className="text-sm font-normal text-neutral-500">({state.variants.length})</span>
        </h2>
        <button type="button" onClick={generate} disabled={state.options.length === 0} className="min-h-9 rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-40" data-testid="generate-variants">
          توليد الأنواع
        </button>
        <button type="button" onClick={addManual} className="min-h-9 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800">
          + إضافة نوع يدويًا
        </button>
      </div>
      {notice ? <p role="status" className="mb-3 rounded-md bg-neutral-800 px-3 py-2 text-xs text-neutral-300">{notice}</p> : null}
      {errors.variants ? <p className={`${fieldError} mb-2`}>{errors.variants}</p> : null}
      {errors.defaultVariantClientId ? <p className={`${fieldError} mb-2`}>{errors.defaultVariantClientId}</p> : null}
      {issues.size ? (
        <p className="mb-3 rounded-md border border-amber-800 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
          {issues.size} نوع يحتاج مراجعة بعد تغيير الخيارات (مظلل بالأصفر): اختر له القيم الصحيحة أو احذفه. لا يُحذف أي نوع تلقائيًا.
        </p>
      ) : null}

      {selected.size > 0 ? <BulkBar count={selected.size} state={state} ids={[...selected]} update={update} onDelete={() => removeVariants([...selected])} /> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[60rem] text-sm">
          <thead className="text-start text-xs text-neutral-400">
            <tr className="border-b border-neutral-800">
              <th className="w-8 px-2 py-2">
                <input
                  type="checkbox"
                  aria-label="تحديد الكل"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(state.variants.map((v) => v.clientId)))}
                  className="h-4 w-4"
                />
              </th>
              <th className="px-2 py-2 text-start">افتراضي</th>
              <th className="px-2 py-2 text-start">التركيبة</th>
              <th className="px-2 py-2 text-start">الصور (الأولى رئيسية)</th>
              <th className="px-2 py-2 text-start">SKU</th>
              <th className="px-2 py-2 text-start">الوزن (ع / En)</th>
              <th className="px-2 py-2 text-start">متوفر</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {state.variants.map((variant, i) => {
              const issue = issues.get(variant.clientId);
              const errs = rowErrors(i);
              const errorFor = (path: string) => errs.find((e) => e.path === path || e.path.startsWith(`${path}.`))?.msg;
              const isOpen = expanded.has(variant.clientId) || Boolean(issue);
              return (
                <Fragment key={variant.clientId}>
                  <tr className={`border-b border-neutral-800 align-top ${issue ? "bg-amber-950/30" : errs.length ? "bg-red-950/20" : ""}`} data-variant-row={arLabel(state.options, variant.options)}>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        aria-label={`تحديد ${arLabel(state.options, variant.options)}`}
                        checked={selected.has(variant.clientId)}
                        onChange={() =>
                          setSelected((sel) => {
                            const next = new Set(sel);
                            if (next.has(variant.clientId)) next.delete(variant.clientId);
                            else next.add(variant.clientId);
                            return next;
                          })
                        }
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="radio"
                        name="defaultVariant"
                        aria-label={`النوع الافتراضي: ${arLabel(state.options, variant.options)}`}
                        checked={state.defaultClientId === variant.clientId}
                        onChange={() => update((s) => ({ ...s, defaultClientId: variant.clientId }))}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <p className="font-medium">{arLabel(state.options, variant.options) || "—"}</p>
                      {issue ? <p className="text-xs text-amber-300">{ORPHAN_TEXT[issue]}</p> : null}
                      {errorFor("options") ? <p className={fieldError}>{errorFor("options")}</p> : null}
                    </td>
                    <td className="px-2 py-2">
                      <ImageStrip images={variant.images} onChange={(images) => setVariant(variant.clientId, { images })} label={arLabel(state.options, variant.options)} />
                      {errorFor("images") ? <p className={fieldError}>{errorFor("images")}</p> : null}
                    </td>
                    <td className="px-2 py-2">
                      <input dir="ltr" value={variant.sku} onChange={(e) => setVariant(variant.clientId, { sku: e.target.value })} aria-label="SKU" className={`${adminInput} w-32 font-mono`} />
                      {errorFor("sku") ? <p className={fieldError}>{errorFor("sku")}</p> : null}
                    </td>
                    <td className="px-2 py-2">
                      {variant.rich?.weightAr || variant.rich?.weightEn ? (
                        <p className="text-xs text-amber-300" title="الوزن منسَّق — عدّله من التفاصيل">
                          {variant.weightAr || variant.weightEn} · منسَّق
                        </p>
                      ) : (
                      <div className="flex gap-1">
                        <input value={variant.weightAr} onChange={(e) => setVariant(variant.clientId, { weightAr: e.target.value })} aria-label="الوزن بالعربية" placeholder="٢٫٥ كجم" className={`${adminInput} w-24`} />
                        <input dir="ltr" value={variant.weightEn} onChange={(e) => setVariant(variant.clientId, { weightEn: e.target.value })} aria-label="Weight (English)" placeholder="2.5 kg" className={`${adminInput} w-24`} />
                      </div>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        role="switch"
                        aria-label="متوفر"
                        checked={variant.available}
                        onChange={(e) => setVariant(variant.clientId, { available: e.target.checked })}
                        className="h-5 w-5 accent-emerald-500"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-label="تفاصيل إضافية"
                          onClick={() =>
                            setExpanded((e) => {
                              const next = new Set(e);
                              if (next.has(variant.clientId)) next.delete(variant.clientId);
                              else next.add(variant.clientId);
                              return next;
                            })
                          }
                          className="rounded-md border border-neutral-700 p-1.5 text-neutral-400 hover:bg-neutral-800"
                        >
                          <ChevronDown size={14} className={isOpen ? "rotate-180" : ""} />
                        </button>
                        <button type="button" aria-label="حذف النوع" onClick={() => removeVariants([variant.clientId])} className="rounded-md border border-neutral-700 p-1.5 text-neutral-400 hover:bg-red-950 hover:text-red-300">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="border-b border-neutral-800 bg-neutral-950/40">
                      <td />
                      <td colSpan={7} className="px-2 py-3">
                        <VariantDetails state={state} variant={variant} setVariant={(patch) => setVariant(variant.clientId, patch)} errorFor={errorFor} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {state.variants.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-2 py-6 text-center text-neutral-500">
                  لا توجد أنواع بعد — أضف الخيارات وقيمها ثم اضغط «توليد الأنواع».
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function VariantDetails({
  state,
  variant,
  setVariant,
  errorFor,
}: {
  state: EditorState;
  variant: EditorVariant;
  setVariant: (patch: Partial<EditorVariant>) => void;
  errorFor: (path: string) => string | undefined;
}) {
  return (
    <div className="space-y-3">
      {state.options.length ? (
        <div className="flex flex-wrap gap-3">
          {state.options.map((o) => (
            <div key={o.key}>
              <label className={adminLabel}>{o.labelAr}</label>
              <select
                value={variant.options[o.key] ?? ""}
                onChange={(e) => setVariant({ options: { ...variant.options, [o.key]: e.target.value } })}
                className={`${adminInput} w-auto`}
              >
                <option value="">— اختر —</option>
                {o.values.map((v) => (
                  <option key={v.uid} value={v.key}>
                    {v.valueAr || v.valueEn}
                  </option>
                ))}
              </select>
              {errorFor(`options.${o.key}`) ? <p className={fieldError}>{errorFor(`options.${o.key}`)}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          [
            ["nameAr", "اسم مخصص بالعربية (اختياري — يُبنى تلقائيًا من اسم المنتج والخيارات)", "rtl", false],
            ["nameEn", "Custom name (English, optional)", "ltr", false],
            ["shortDescriptionAr", "وصف قصير بالعربية (اختياري — وإلا وصف المنتج)", "rtl", false],
            ["shortDescriptionEn", "Short description (English, optional)", "ltr", false],
            ["descriptionAr", "الوصف بالعربية (اختياري — وإلا وصف المنتج)", "rtl", true],
            ["descriptionEn", "Description (English, optional)", "ltr", true],
            ["weightAr", "الوزن بالعربية", "rtl", false],
            ["weightEn", "Weight (English)", "ltr", false],
            ["packagingAr", "التعبئة بالعربية", "rtl", true],
            ["packagingEn", "Packaging (English)", "ltr", true],
            ["storageAr", "التخزين بالعربية", "rtl", true],
            ["storageEn", "Storage (English)", "ltr", true],
          ] as const
        ).map(([field, label, dir, multiline]) => (
          <div key={field}>
            <StyledTextField
              label={label}
              dir={dir}
              multiline={multiline}
              value={variant[field]}
              rich={variant.rich?.[field]}
              onChange={(value, rich) => setVariant({ [field]: value, rich: setRich(variant.rich, field, rich) })}
            />
            {errorFor(field) ? <p className={fieldError}>{errorFor(field)}</p> : null}
          </div>
        ))}
      </div>

      <div>
        <p className={adminLabel}>مواصفات إضافية</p>
        <div className="space-y-2">
          {variant.specs.map((spec, k) => (
            <div key={spec.uid} className="grid grid-cols-1 gap-2 rounded-md border border-neutral-800 p-2 sm:grid-cols-[1fr_1fr_auto]">
              {(
                [
                  ["labelAr", "العنوان بالعربية", "rtl"],
                  ["labelEn", "Label (EN)", "ltr"],
                  ["valueAr", "القيمة بالعربية", "rtl"],
                  ["valueEn", "Value (EN)", "ltr"],
                ] as const
              ).map(([field, label, dir]) => (
                <StyledTextField
                  key={field}
                  label={label}
                  dir={dir}
                  value={spec[field]}
                  rich={spec.rich?.[field]}
                  onChange={(value, rich) =>
                    setVariant({ specs: variant.specs.map((sp) => (sp.uid === spec.uid ? { ...sp, [field]: value, rich: setRich(sp.rich, field, rich) } : sp)) })
                  }
                />
              ))}
              <button type="button" aria-label="حذف المواصفة" onClick={() => setVariant({ specs: variant.specs.filter((sp) => sp.uid !== spec.uid) })} className="self-start rounded-md border border-neutral-700 p-2 text-neutral-400 hover:text-red-300">
                <X size={14} />
              </button>
              {errorFor(`specs.${k}`) ? <p className={`${fieldError} col-span-full`}>{errorFor(`specs.${k}`)}</p> : null}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setVariant({ specs: [...variant.specs, { uid: uid("s"), labelAr: "", labelEn: "", valueAr: "", valueEn: "" }] })}
          className="mt-2 min-h-9 rounded-md border border-dashed border-neutral-600 px-3 text-xs text-neutral-300 hover:bg-neutral-800"
        >
          + إضافة مواصفة
        </button>
      </div>
    </div>
  );
}

function ImageStrip({ images, onChange, label }: { images: EditorImage[]; onChange: (images: EditorImage[]) => void; label: string }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = images.map((i) => i.uid);
    onChange(arrayMove(images, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <DndContext id={`images-${label}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={images.map((i) => i.uid)} strategy={horizontalListSortingStrategy}>
          {images.map((img, i) => (
            <Thumb key={img.uid} image={img} main={i === 0} onRemove={() => onChange(images.filter((x) => x.uid !== img.uid))} />
          ))}
        </SortableContext>
      </DndContext>
      <MultiMediaPickerButton label="+ صور" uploadFolderName="Products" onConfirm={(items) => onChange([...images, ...toImages(items)])} className="flex h-12 items-center rounded-md border border-dashed border-neutral-600 px-2 text-xs text-neutral-400 hover:text-neutral-200" />
    </div>
  );
}

function Thumb({ image, main, onRemove }: { image: EditorImage; main: boolean; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.uid });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="group relative h-12 w-12">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.url} alt="" {...attributes} {...listeners} className={`h-12 w-12 cursor-grab rounded-md object-cover ${main ? "ring-2 ring-amber-400" : ""}`} />
      {main ? <span className="absolute bottom-0 start-0 rounded-sm bg-amber-400 px-1 text-[9px] font-bold text-neutral-900">رئيسية</span> : null}
      <button type="button" onClick={onRemove} aria-label="إزالة الصورة" className="absolute -end-1 -top-1 hidden rounded-full bg-neutral-900 p-0.5 text-neutral-300 group-hover:block focus-visible:block">
        <X size={10} />
      </button>
    </div>
  );
}

/** Bulk edit for the selected rows: same images / weight / packaging / availability for all. */
function BulkBar({
  count,
  ids,
  update,
  onDelete,
}: {
  count: number;
  state: EditorState;
  ids: string[];
  update: (fn: (s: EditorState) => EditorState) => void;
  onDelete: () => void;
}) {
  const [weightAr, setWeightAr] = useState("");
  const [weightEn, setWeightEn] = useState("");
  const [packagingAr, setPackagingAr] = useState("");
  const [packagingEn, setPackagingEn] = useState("");
  const apply = (patch: Partial<EditorVariant>) => update((s) => ({ ...s, variants: s.variants.map((v) => (ids.includes(v.clientId) ? { ...v, ...patch } : v)) }));

  return (
    <div className="mb-3 space-y-2 rounded-md border border-amber-900/60 bg-amber-950/20 p-3 text-sm" data-testid="bulk-bar">
      <p className="font-medium">تعديل جماعي — {count} محدد</p>
      <div className="flex flex-wrap items-end gap-2">
        <MultiMediaPickerButton
          label="تعيين الصور للمحدد"
          uploadFolderName="Products"
          onConfirm={(items) => apply({ images: toImages(items) })}
          className="min-h-9 rounded-md border border-neutral-600 px-3 text-xs text-neutral-200 hover:bg-neutral-800"
        />
        <div className="flex items-end gap-1">
          <input value={weightAr} onChange={(e) => setWeightAr(e.target.value)} placeholder="الوزن بالعربية" aria-label="الوزن بالعربية للمحدد" className={`${adminInput} w-28`} />
          <input dir="ltr" value={weightEn} onChange={(e) => setWeightEn(e.target.value)} placeholder="Weight (EN)" aria-label="Weight for selected" className={`${adminInput} w-28`} />
          <button type="button" onClick={() => apply({ weightAr, weightEn })} className="min-h-9 rounded-md border border-neutral-600 px-2 text-xs hover:bg-neutral-800">
            تطبيق الوزن
          </button>
        </div>
        <div className="flex items-end gap-1">
          <input value={packagingAr} onChange={(e) => setPackagingAr(e.target.value)} placeholder="التعبئة بالعربية" aria-label="التعبئة بالعربية للمحدد" className={`${adminInput} w-36`} />
          <input dir="ltr" value={packagingEn} onChange={(e) => setPackagingEn(e.target.value)} placeholder="Packaging (EN)" aria-label="Packaging for selected" className={`${adminInput} w-36`} />
          <button type="button" onClick={() => apply({ packagingAr, packagingEn })} className="min-h-9 rounded-md border border-neutral-600 px-2 text-xs hover:bg-neutral-800">
            تطبيق التعبئة
          </button>
        </div>
        <button type="button" onClick={() => apply({ available: true })} className="min-h-9 rounded-md border border-neutral-600 px-2 text-xs hover:bg-neutral-800">
          متوفر
        </button>
        <button type="button" onClick={() => apply({ available: false })} className="min-h-9 rounded-md border border-neutral-600 px-2 text-xs hover:bg-neutral-800">
          غير متوفر
        </button>
        <button type="button" onClick={onDelete} className="min-h-9 rounded-md border border-red-900 px-2 text-xs text-red-300 hover:bg-red-950">
          حذف المحدد
        </button>
      </div>
    </div>
  );
}
