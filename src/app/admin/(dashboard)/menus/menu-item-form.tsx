"use client";

import { useActionState, useState } from "react";
import { createMenuItemAction, updateMenuItemAction, type FormActionState } from "./actions";

const initialState: FormActionState = {};

export interface PickerOption {
  id: string;
  label: string;
}

interface MenuItemFormProps {
  mode: "create" | "edit";
  menuLocation: "HEADER" | "FOOTER";
  itemId?: string;
  defaultValues?: {
    labelEn: string;
    labelAr: string;
    linkType: "PAGE" | "CATEGORY" | "PRODUCT" | "URL";
    targetId: string;
    url: string;
    parentId: string;
  };
  parentOptions: PickerOption[];
  pageOptions: PickerOption[];
  categoryOptions: PickerOption[];
  productOptions: PickerOption[];
  onDone: () => void;
}

export function MenuItemForm({
  mode,
  menuLocation,
  itemId,
  defaultValues,
  parentOptions,
  pageOptions,
  categoryOptions,
  productOptions,
  onDone,
}: MenuItemFormProps) {
  const action = mode === "create" ? createMenuItemAction : updateMenuItemAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [linkType, setLinkType] = useState(defaultValues?.linkType ?? "URL");

  const targetOptions = linkType === "PAGE" ? pageOptions : linkType === "CATEGORY" ? categoryOptions : linkType === "PRODUCT" ? productOptions : [];

  if (state.success && !pending) {
    onDone();
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="menuLocation" value={menuLocation} />
      {itemId ? <input type="hidden" name="id" value={itemId} /> : null}

      <div>
        <label className="mb-1 block text-xs text-neutral-400">Label (English)</label>
        <input name="labelEn" defaultValue={defaultValues?.labelEn} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div dir="rtl">
        <label className="mb-1 block text-xs text-neutral-400">التسمية (عربي)</label>
        <input name="labelAr" defaultValue={defaultValues?.labelAr} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Links to</label>
        <select
          name="linkType"
          value={linkType}
          onChange={(e) => setLinkType(e.target.value as typeof linkType)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
        >
          <option value="URL">Custom URL</option>
          <option value="PAGE">Page</option>
          <option value="CATEGORY">Category</option>
          <option value="PRODUCT">Product</option>
        </select>
      </div>

      {linkType === "URL" ? (
        <div>
          <label className="mb-1 block text-xs text-neutral-400">URL</label>
          <input name="url" defaultValue={defaultValues?.url} placeholder="/about or https://..." className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Target</label>
          <select name="targetId" defaultValue={defaultValues?.targetId} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
            <option value="">Select...</option>
            {targetOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-neutral-400">Parent item (for dropdown/mega menu nesting)</label>
        <select name="parentId" defaultValue={defaultValues?.parentId ?? ""} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          <option value="">None (top level)</option>
          {parentOptions
            .filter((opt) => opt.id !== itemId)
            .map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
        </select>
      </div>

      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
        {pending ? "Saving..." : mode === "create" ? "Add item" : "Save changes"}
      </button>
    </form>
  );
}
