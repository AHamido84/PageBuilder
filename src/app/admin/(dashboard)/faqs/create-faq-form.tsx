"use client";

import { useActionState, useRef, useEffect } from "react";
import { createFaqAction, type FormActionState } from "./actions";

const initialState: FormActionState = {};
const inputClass = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm";
const labelClass = "mb-1 block text-xs text-neutral-400";

export function CreateFaqForm() {
  const [state, formAction, pending] = useActionState(createFaqAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className={labelClass}>Question (English)</label>
        <input name="questionEn" required className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>السؤال (عربي)</label>
        <input name="questionAr" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Answer (English)</label>
        <textarea name="answerEn" required rows={3} className={inputClass} />
      </div>
      <div dir="rtl">
        <label className={labelClass}>الإجابة (عربي)</label>
        <textarea name="answerAr" required rows={3} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Category (optional)</label>
        <input name="category" placeholder="e.g. Ordering, Delivery" className={inputClass} />
      </div>
      {state.error ? <p className="col-span-full text-sm text-red-400">{state.error}</p> : null}
      <div className="col-span-full">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
          {pending ? "Adding..." : "Add FAQ"}
        </button>
      </div>
    </form>
  );
}
