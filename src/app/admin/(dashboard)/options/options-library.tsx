"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/ui/toast";
import { DISPLAY_LABELS, OptionTypeForm, type OptionTypeRow } from "@/components/admin/variants/option-type-form";
import { deleteOptionTypeAction, reorderOptionTypesAction, setVariantsEnabledAction } from "./actions";

type Row = OptionTypeRow & { usedBy: { id: string; label: string }[] };

export function OptionsLibrary({
  types,
  canUpdate,
  canDelete,
  canToggleSite,
  variantsEnabled,
  envOverride,
}: {
  types: Row[];
  canUpdate: boolean;
  canDelete: boolean;
  canToggleSite: boolean;
  variantsEnabled: boolean;
  envOverride: string | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useAdminToast();
  const [rows, setRows] = useState(types);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [enabled, setEnabled] = useState(variantsEnabled);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = rows.map((r) => r.id);
    const next = arrayMove(rows, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setRows(next);
    const result = await reorderOptionTypesAction(next.map((r) => r.id));
    if (!result.ok) toast.push({ title: result.error ?? "تعذر حفظ الترتيب", tone: "error" });
  }

  async function remove(row: Row) {
    if (row.usedBy.length > 0) {
      toast.push({ title: "لا يمكن حذف خيار مستخدم", description: row.usedBy.map((p) => p.label).join("، "), tone: "error" });
      return;
    }
    const ok = await confirm({ title: `حذف «${row.labelAr}»؟`, description: "سيُحذف الخيار من المكتبة نهائيًا.", confirmLabel: "حذف", cancelLabel: "إلغاء", danger: true });
    if (!ok) return;
    const result = await deleteOptionTypeAction(row.id);
    if (!result.ok) toast.push({ title: result.error ?? "تعذر الحذف", tone: "error" });
    else setRows((r) => r.filter((x) => x.id !== row.id));
  }

  async function toggleSite() {
    const next = !enabled;
    const ok = await confirm({
      title: next ? "تفعيل الأنواع في الموقع؟" : "إيقاف الأنواع في الموقع؟",
      description: next
        ? "ستظهر اختيارات الأنواع في صفحات المنتجات والبطاقات والفلاتر ونموذج طلب السعر."
        : "سيعود الموقع للعرض السابق تمامًا (منتج واحد لكل بطاقة، بدون اختيارات). البيانات لا تُحذف.",
      confirmLabel: next ? "تفعيل" : "إيقاف",
      cancelLabel: "إلغاء",
    });
    if (!ok) return;
    const result = await setVariantsEnabledAction(next);
    if (!result.ok) return toast.push({ title: result.error ?? "تعذر الحفظ", tone: "error" });
    setEnabled(next);
    toast.push({ title: next ? "تم تفعيل الأنواع في الموقع" : "تم إيقاف الأنواع في الموقع", tone: "success" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {canToggleSite ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <div>
            <p className="text-sm font-medium">عرض الأنواع في الموقع العام</p>
            <p className="text-xs text-neutral-500">
              {enabled ? "مفعّل" : "متوقف — الموقع يعرض المنتجات كما كانت سابقًا"}
              {envOverride ? <span dir="ltr"> · VARIANTS_ENABLED={envOverride} (env override)</span> : null}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={toggleSite}
            className={`min-h-9 rounded-md px-3 py-1.5 text-sm font-medium ${enabled ? "bg-emerald-700 text-white hover:bg-emerald-600" : "border border-neutral-700 text-neutral-200 hover:bg-neutral-800"}`}
          >
            {enabled ? "إيقاف" : "تفعيل"}
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <DndContext id="option-types" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <ul aria-label="الخيارات">
              {rows.map((row) =>
                editingId === row.id ? (
                  <li key={row.id} className="border-t border-neutral-800 bg-neutral-900 p-4 first:border-t-0">
                    <OptionTypeForm
                      initial={row}
                      onCancel={() => setEditingId(null)}
                      onSaved={(saved) => {
                        setRows((r) => r.map((x) => (x.id === saved.id ? { ...x, ...saved } : x)));
                        setEditingId(null);
                        toast.push({ title: "تم حفظ الخيار", tone: "success" });
                      }}
                    />
                  </li>
                ) : (
                  <SortableRow key={row.id} row={row} canUpdate={canUpdate} canDelete={canDelete} onEdit={() => setEditingId(row.id)} onDelete={() => remove(row)} />
                )
              )}
              {rows.length === 0 ? <li className="px-4 py-6 text-center text-sm text-neutral-500">لا توجد خيارات بعد.</li> : null}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      {canUpdate ? (
        adding ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <OptionTypeForm
              submitLabel="إضافة الخيار"
              onCancel={() => setAdding(false)}
              onSaved={(saved) => {
                setRows((r) => [...r, { ...saved, usedBy: [] }]);
                setAdding(false);
                toast.push({ title: "تمت إضافة الخيار", tone: "success" });
              }}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="min-h-9 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800">
            + إضافة خيار جديد
          </button>
        )
      ) : null}
    </div>
  );
}

function SortableRow({ row, canUpdate, canDelete, onEdit, onDelete }: { row: Row; canUpdate: boolean; canDelete: boolean; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id, disabled: !canUpdate });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-wrap items-center gap-3 border-t border-neutral-800 px-4 py-3 text-sm first:border-t-0 ${isDragging ? "bg-neutral-800" : ""}`}
    >
      {canUpdate ? (
        <button type="button" {...attributes} {...listeners} aria-label={`نقل ${row.labelAr}`} className="cursor-grab rounded p-1 text-neutral-500 hover:text-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
          <GripVertical size={16} />
        </button>
      ) : null}
      <div className="min-w-40 flex-1">
        <p className="font-medium">
          {row.labelAr} <span className="text-neutral-500">/ {row.labelEn}</span>
        </p>
        <p className="text-xs text-neutral-500">
          <span dir="ltr" className="font-mono">{row.key}</span> · {DISPLAY_LABELS[row.display]}
        </p>
      </div>
      <div className="min-w-40 flex-1 text-xs text-neutral-400">
        {row.usedBy.length ? (
          <>
            مستخدم في:{" "}
            {row.usedBy.map((p, i) => (
              <span key={p.id}>
                {i > 0 ? "، " : null}
                <Link href={`/admin/products/${p.id}`} className="underline hover:text-neutral-200">
                  {p.label}
                </Link>
              </span>
            ))}
          </>
        ) : (
          "غير مستخدم"
        )}
      </div>
      <div className="flex gap-2">
        {canUpdate ? (
          <button type="button" onClick={onEdit} className="min-h-9 rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-800">
            تعديل
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            aria-disabled={row.usedBy.length > 0}
            title={row.usedBy.length > 0 ? "مستخدم في منتجات — لا يمكن حذفه" : undefined}
            className="min-h-9 rounded-md border border-red-900 px-3 py-1 text-xs text-red-300 hover:bg-red-950 aria-disabled:opacity-40"
          >
            حذف
          </button>
        ) : null}
      </div>
    </li>
  );
}
