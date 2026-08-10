"use client";

import { useActionState, useRef, useEffect } from "react";
import { createRedirectAction, type FormActionState } from "./actions";

const initialState: FormActionState = {};
const inputClass = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm";

export function CreateRedirectForm() {
  const [state, formAction, pending] = useActionState(createRedirectAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">From path</label>
        <input name="fromPath" placeholder="/old-page" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">To path or URL</label>
        <input name="toPath" placeholder="/new-page" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Type</label>
        <select name="statusCode" defaultValue="MOVED_PERMANENTLY" className={inputClass}>
          <option value="MOVED_PERMANENTLY">301 Permanent</option>
          <option value="FOUND">302 Temporary</option>
        </select>
      </div>
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
          {pending ? "Adding…" : "Add redirect"}
        </button>
      </div>
      {state.error ? <p className="col-span-full text-sm text-red-400">{state.error}</p> : null}
    </form>
  );
}
