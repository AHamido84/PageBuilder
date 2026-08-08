"use client";

import { useActionState, useRef, useEffect } from "react";
import { createUserAction, type FormActionState } from "./actions";

const initialState: FormActionState = {};

export function CreateUserForm({ roles }: { roles: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-end">
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Name</label>
        <input name="name" required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Email</label>
        <input name="email" type="email" required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Password</label>
        <input name="password" type="password" required minLength={8} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Role</label>
        <select name="roleId" required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add user"}
      </button>
      {state.error ? <p className="col-span-full text-sm text-red-400">{state.error}</p> : null}
    </form>
  );
}
