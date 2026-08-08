"use client";

import { useActionState } from "react";
import { updateUserAction, type FormActionState } from "../actions";

const initialState: FormActionState = {};

interface Props {
  user: { id: string; name: string; email: string; roleId: string; isActive: boolean };
  roles: { id: string; name: string }[];
}

export function EditUserForm({ user, roles }: Props) {
  const [state, formAction, pending] = useActionState(updateUserAction, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <input type="hidden" name="id" value={user.id} />
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Name</label>
        <input name="name" defaultValue={user.name} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Email</label>
        <input name="email" type="email" defaultValue={user.email} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">New password (leave blank to keep current)</label>
        <input name="password" type="password" minLength={8} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Role</label>
        <select name="roleId" defaultValue={user.roleId} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input type="checkbox" name="isActive" value="true" defaultChecked={user.isActive} />
        Active
      </label>
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">Saved.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
