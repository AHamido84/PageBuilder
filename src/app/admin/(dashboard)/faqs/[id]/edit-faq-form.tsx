"use client";

import { useActionState } from "react";
import { updateFaqAction, type FormActionState } from "../actions";

const initialState: FormActionState = {};
const inputClass = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm";
const labelClass = "mb-1 block text-xs text-neutral-400";

interface Props {
  faq: {
    id: string;
    questionEn: string;
    questionAr: string;
    answerEn: string;
    answerAr: string;
    category: string | null;
    isPublished: boolean;
  };
}

export function EditFaqForm({ faq }: Props) {
  const [state, formAction, pending] = useActionState(updateFaqAction, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={faq.id} />
      <div>
        <label className={labelClass}>Question (English)</label>
        <input name="questionEn" defaultValue={faq.questionEn} required className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>السؤال (عربي)</label>
        <input name="questionAr" defaultValue={faq.questionAr} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Answer (English)</label>
        <textarea name="answerEn" defaultValue={faq.answerEn} required rows={4} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>الإجابة (عربي)</label>
        <textarea name="answerAr" defaultValue={faq.answerAr} required rows={4} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Category</label>
        <input name="category" defaultValue={faq.category ?? ""} className={inputClass} />
      </div>
      <label className="flex items-end gap-2 pb-1.5 text-sm text-neutral-300">
        <input type="checkbox" name="isPublished" value="true" defaultChecked={faq.isPublished} />
        Published
      </label>
      {state.error ? <p className="col-span-full text-sm text-red-400">{state.error}</p> : null}
      {state.success ? <p className="col-span-full text-sm text-emerald-400">Saved.</p> : null}
      <div className="col-span-full">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
