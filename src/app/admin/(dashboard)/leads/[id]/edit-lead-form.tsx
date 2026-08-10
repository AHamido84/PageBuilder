"use client";

import { useActionState } from "react";
import { updateLeadAction, type FormActionState } from "../actions";

const initialState: FormActionState = {};

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "IN_PROGRESS", "WON", "LOST"];

interface Props {
  lead: {
    id: string;
    contactName: string;
    companyName: string | null;
    email: string;
    phone: string | null;
    message: string | null;
    status: string;
    assigneeId: string | null;
  };
  users: { id: string; name: string }[];
}

export function EditLeadForm({ lead, users }: Props) {
  const [state, formAction, pending] = useActionState(updateLeadAction, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={lead.id} />
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Contact name</label>
        <input name="contactName" defaultValue={lead.contactName} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Company</label>
        <input name="companyName" defaultValue={lead.companyName ?? ""} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Email</label>
        <input name="email" type="email" defaultValue={lead.email} required className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Phone</label>
        <input name="phone" defaultValue={lead.phone ?? ""} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs text-neutral-400">Message</label>
        <textarea name="message" defaultValue={lead.message ?? ""} rows={3} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Status</label>
        <select name="status" defaultValue={lead.status} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Assigned to</label>
        <select name="assigneeId" defaultValue={lead.assigneeId ?? ""} className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm">
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
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
