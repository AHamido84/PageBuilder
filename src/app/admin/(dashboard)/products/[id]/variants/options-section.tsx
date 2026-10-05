"use client";

import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { MediaLibraryModal } from "@/components/admin/ui/media-library-modal";
import { DISPLAY_LABELS, OptionTypeForm, adminInput, adminLabel, fieldError, type OptionTypeRow } from "@/components/admin/variants/option-type-form";
import { slugifyKey } from "@/lib/catalog/variants/core";
import { uid, type EditorOption, type EditorState, type EditorValue } from "./editor-state";

const ARABIC = /[؀-ۿ]/;

function uniqueKey(base: string, taken: string[]): string {
  const root = base || "v";
  if (!taken.includes(root)) return root;
  for (let n = 2; ; n++) if (!taken.includes(`${root}-${n}`)) return `${root}-${n}`;
}

export function OptionsSection({
  state,
  update,
  library,
  onLibraryAdd,
  errors,
}: {
  state: EditorState;
  update: (fn: (s: EditorState) => EditorState) => void;
  library: OptionTypeRow[];
  onLibraryAdd: (row: OptionTypeRow) => void;
  errors: Record<string, string>;
}) {
  const confirm = useConfirm();
  const [creating, setCreating] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const unused = library.filter((t) => !state.options.some((o) => o.optionTypeId === t.id));

  function addOption(type: OptionTypeRow) {
    update((s) => ({ ...s, options: [...s.options, { optionTypeId: type.id, key: type.key, labelAr: type.labelAr, labelEn: type.labelEn, display: type.display, values: [] }] }));
  }

  async function removeOption(option: EditorOption) {
    const used = state.variants.filter((v) => option.key in v.options).length;
    const ok = await confirm({
      title: `إزالة خيار «${option.labelAr}»؟`,
      description: used
        ? `${used} نوع يستخدم هذا الخيار. ستُحذف قيمته منها وتبقى بقية بياناتها؛ أي تركيبات تصبح مكررة ستُعلَّم للمراجعة. لا يُحفظ شيء قبل الضغط على «حفظ».`
        : "لن يُحفظ التغيير قبل الضغط على «حفظ».",
      confirmLabel: "إزالة",
      cancelLabel: "إلغاء",
      danger: true,
    });
    if (!ok) return;
    update((s) => ({
      ...s,
      options: s.options.filter((o) => o.optionTypeId !== option.optionTypeId),
      variants: s.variants.map((v) => {
        const { [option.key]: _removed, ...rest } = v.options;
        void _removed;
        return { ...v, options: rest };
      }),
    }));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    update((s) => {
      const ids = s.options.map((o) => o.optionTypeId);
      return { ...s, options: arrayMove(s.options, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))) };
    });
  }

  return (
    <section aria-labelledby="variants-options-title" className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 id="variants-options-title" className="mb-1 text-base font-semibold">الخيارات</h2>
      <p className="mb-4 text-xs text-neutral-500">الخيارات التي تختلف بها الأنواع (مثل المقاس والوزن). اسحب لإعادة الترتيب — الترتيب نفسه يظهر في الموقع.</p>
      {errors.options ? <p className={`${fieldError} mb-3`}>{errors.options}</p> : null}

      <DndContext id="variant-options" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={state.options.map((o) => o.optionTypeId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {state.options.map((option, i) => (
              <OptionCard key={option.optionTypeId} option={option} index={i} state={state} update={update} onRemove={() => removeOption(option)} errors={errors} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {unused.length ? (
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">إضافة خيار من المكتبة</span>
            <select
              value=""
              onChange={(e) => {
                const type = library.find((t) => t.id === e.target.value);
                if (type) addOption(type);
              }}
              className={`${adminInput} w-auto min-h-9`}
              data-testid="add-option"
            >
              <option value="">+ إضافة خيار…</option>
              {unused.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.labelAr} / {t.labelEn}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {!creating ? (
          <button type="button" onClick={() => setCreating(true)} className="min-h-9 rounded-md border border-dashed border-neutral-600 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800">
            + إنشاء خيار جديد
          </button>
        ) : null}
      </div>
      {creating ? (
        <div className="mt-3 rounded-md border border-neutral-700 p-3">
          <p className="mb-2 text-xs text-neutral-400">خيار جديد يُضاف إلى المكتبة العامة ويمكن استخدامه في أي منتج.</p>
          <OptionTypeForm
            submitLabel="إنشاء وإضافة"
            onCancel={() => setCreating(false)}
            onSaved={(row) => {
              onLibraryAdd(row);
              addOption(row);
              setCreating(false);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}

function OptionCard({
  option,
  index,
  state,
  update,
  onRemove,
  errors,
}: {
  option: EditorOption;
  index: number;
  state: EditorState;
  update: (fn: (s: EditorState) => EditorState) => void;
  onRemove: () => void;
  errors: Record<string, string>;
}) {
  const confirm = useConfirm();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: option.optionTypeId });
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [pickingImageFor, setPickingImageFor] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  function setOption(fn: (o: EditorOption) => EditorOption) {
    update((s) => ({ ...s, options: s.options.map((o) => (o.optionTypeId === option.optionTypeId ? fn(o) : o)) }));
  }

  function addValue() {
    const text = draft.trim();
    if (!text) return;
    const isAr = ARABIC.test(text);
    const taken = option.values.map((v) => v.key);
    const value: EditorValue = {
      uid: uid("val"),
      id: null,
      key: uniqueKey(slugifyKey(text), taken),
      keyTouched: false,
      valueAr: text,
      valueEn: isAr ? "" : text,
      swatchHex: option.display === "SWATCH" ? "#cccccc" : "",
      imageUrl: "",
    };
    setOption((o) => ({ ...o, values: [...o.values, value] }));
    setDraft("");
    if (isAr) setEditing(value.uid); // the English value still needs filling in
  }

  /** Edits a value; a key change is carried over to every variant using the old key. */
  function editValue(valueUid: string, patch: Partial<EditorValue>) {
    update((s) => {
      const current = s.options.find((o) => o.optionTypeId === option.optionTypeId)?.values.find((v) => v.uid === valueUid);
      if (!current) return s;
      const next = { ...current, ...patch };
      if (patch.valueEn !== undefined && !next.keyTouched) {
        const taken = option.values.filter((v) => v.uid !== valueUid).map((v) => v.key);
        next.key = uniqueKey(slugifyKey(patch.valueEn) || current.key, taken);
      }
      const renamed = next.key !== current.key;
      return {
        ...s,
        options: s.options.map((o) => (o.optionTypeId === option.optionTypeId ? { ...o, values: o.values.map((v) => (v.uid === valueUid ? next : v)) } : o)),
        variants: renamed
          ? s.variants.map((v) => (v.options[option.key] === current.key ? { ...v, options: { ...v.options, [option.key]: next.key } } : v))
          : s.variants,
      };
    });
  }

  async function removeValue(value: EditorValue) {
    const used = state.variants.filter((v) => v.options[option.key] === value.key).length;
    if (used) {
      const ok = await confirm({
        title: `حذف القيمة «${value.valueAr || value.valueEn}»؟`,
        description: `${used} نوع يستخدم هذه القيمة. لن تُحذف هذه الأنواع — ستُعلَّم للمراجعة في جدول الأنواع لتختار لها قيمة أخرى أو تحذفها.`,
        confirmLabel: "حذف القيمة",
        cancelLabel: "إلغاء",
        danger: true,
      });
      if (!ok) return;
    }
    setOption((o) => ({ ...o, values: o.values.filter((v) => v.uid !== value.uid) }));
    if (editing === value.uid) setEditing(null);
  }

  function onValuesDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOption((o) => {
      const ids = o.values.map((v) => v.uid);
      return { ...o, values: arrayMove(o.values, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))) };
    });
  }

  const editingValue = option.values.find((v) => v.uid === editing);
  const editingIndex = option.values.findIndex((v) => v.uid === editing);
  const valueErrors = option.values.map((_, j) =>
    Object.entries(errors).filter(([path]) => path.startsWith(`options.${index}.values.${j}.`)).map(([, msg]) => msg)[0]
  );

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`rounded-md border p-3 ${errors[`options.${index}`] ? "border-red-700" : "border-neutral-700"}`} data-option={option.key}>
      <div className="mb-3 flex items-center gap-2">
        <button type="button" {...attributes} {...listeners} aria-label={`نقل خيار ${option.labelAr}`} className="cursor-grab rounded p-1 text-neutral-500 hover:text-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
          <GripVertical size={16} />
        </button>
        <p className="flex-1 text-sm font-medium">
          {option.labelAr} <span className="text-neutral-500">/ {option.labelEn}</span>{" "}
          <span className="text-xs font-normal text-neutral-500">
            · <span dir="ltr" className="font-mono">{option.key}</span> · {DISPLAY_LABELS[option.display]}
          </span>
        </p>
        <button type="button" onClick={onRemove} className="min-h-9 rounded-md border border-neutral-700 px-2 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-red-300">
          إزالة الخيار
        </button>
      </div>
      {errors[`options.${index}`] ? <p className={`${fieldError} mb-2`}>{errors[`options.${index}`]}</p> : null}

      <DndContext id={`values-${option.optionTypeId}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onValuesDragEnd}>
        <SortableContext items={option.values.map((v) => v.uid)} strategy={horizontalListSortingStrategy}>
          <ul className="flex flex-wrap gap-2" aria-label={`قيم ${option.labelAr}`}>
            {option.values.map((value, j) => (
              <ValueChip
                key={value.uid}
                value={value}
                display={option.display}
                active={editing === value.uid}
                invalid={Boolean(valueErrors[j]) || !value.valueEn || !value.valueAr}
                onEdit={() => setEditing(editing === value.uid ? null : value.uid)}
                onRemove={() => removeValue(value)}
              />
            ))}
            <li>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addValue();
                  }
                }}
                placeholder="اكتب قيمة واضغط Enter"
                aria-label={`إضافة قيمة إلى ${option.labelAr}`}
                className={`${adminInput} min-h-9 w-48`}
              />
            </li>
          </ul>
        </SortableContext>
      </DndContext>
      {errors[`options.${index}.values`] ? <p className={fieldError}>{errors[`options.${index}.values`]}</p> : null}

      {editingValue ? (
        <div className="mt-3 grid grid-cols-1 gap-3 rounded-md bg-neutral-800/60 p-3 sm:grid-cols-4">
          <div>
            <label className={adminLabel}>القيمة بالعربية</label>
            <input value={editingValue.valueAr} onChange={(e) => editValue(editingValue.uid, { valueAr: e.target.value })} className={adminInput} />
            {errors[`options.${index}.values.${editingIndex}.valueAr`] ? <p className={fieldError}>{errors[`options.${index}.values.${editingIndex}.valueAr`]}</p> : null}
          </div>
          <div>
            <label className={adminLabel}>Value (English)</label>
            <input dir="ltr" value={editingValue.valueEn} onChange={(e) => editValue(editingValue.uid, { valueEn: e.target.value })} className={adminInput} autoFocus={!editingValue.valueEn} />
            {!editingValue.valueEn ? <p className={fieldError}>القيمة بالإنجليزية مطلوبة</p> : null}
          </div>
          <div>
            <label className={adminLabel}>المفتاح في الرابط</label>
            <input
              dir="ltr"
              value={editingValue.key}
              onChange={(e) => editValue(editingValue.uid, { key: e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ""), keyTouched: true })}
              className={`${adminInput} font-mono`}
            />
            {errors[`options.${index}.values.${editingIndex}.key`] ? <p className={fieldError}>{errors[`options.${index}.values.${editingIndex}.key`]}</p> : null}
          </div>
          {option.display === "SWATCH" ? (
            <div>
              <label className={adminLabel}>اللون</label>
              <input type="color" value={editingValue.swatchHex || "#cccccc"} onChange={(e) => editValue(editingValue.uid, { swatchHex: e.target.value })} className="h-9 w-full cursor-pointer rounded-md border border-neutral-700 bg-neutral-800" />
            </div>
          ) : null}
          {option.display === "IMAGE" ? (
            <div>
              <label className={adminLabel}>صورة القيمة</label>
              <div className="flex items-center gap-2">
                {editingValue.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editingValue.imageUrl} alt="" className="h-9 w-9 rounded object-cover" />
                ) : null}
                <button type="button" onClick={() => setPickingImageFor(editingValue.uid)} className="min-h-9 rounded-md border border-neutral-700 px-2 text-xs text-neutral-300 hover:bg-neutral-800">
                  {editingValue.imageUrl ? "تغيير" : "اختيار صورة"}
                </button>
                {editingValue.imageUrl ? (
                  <button type="button" onClick={() => editValue(editingValue.uid, { imageUrl: "" })} className="text-xs text-neutral-500 hover:text-red-300">
                    إزالة
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <MediaLibraryModal
        open={pickingImageFor !== null}
        onClose={() => setPickingImageFor(null)}
        title="صورة القيمة"
        accept="IMAGE"
        selectedIds={[]}
        uploadFolderName="Products"
        onSelect={(item) => pickingImageFor && editValue(pickingImageFor, { imageUrl: item.url })}
      />
    </div>
  );
}

function ValueChip({
  value,
  display,
  active,
  invalid,
  onEdit,
  onRemove,
}: {
  value: EditorValue;
  display: EditorOption["display"];
  active: boolean;
  invalid: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: value.uid });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex min-h-9 items-center gap-1 rounded-full border ps-1 pe-1 text-sm ${active ? "border-amber-400 bg-neutral-800" : invalid ? "border-red-700" : "border-neutral-600"}`}
      data-value-chip={value.key}
    >
      <span {...attributes} {...listeners} aria-label={`نقل ${value.valueAr}`} role="button" tabIndex={0} className="cursor-grab px-1 text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
        <GripVertical size={12} />
      </span>
      {display === "SWATCH" && value.swatchHex ? <span className="h-4 w-4 rounded-full border border-neutral-500" style={{ backgroundColor: value.swatchHex }} aria-hidden="true" /> : null}
      <button type="button" onClick={onEdit} aria-expanded={active} className="px-1 hover:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
        {value.valueAr || value.valueEn}
        {value.valueEn && value.valueEn !== value.valueAr ? <span className="text-neutral-500"> / {value.valueEn}</span> : null}
      </button>
      <button type="button" onClick={onRemove} aria-label={`حذف ${value.valueAr || value.valueEn}`} className="rounded-full p-1 text-neutral-500 hover:bg-neutral-700 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
        <X size={12} />
      </button>
    </li>
  );
}
