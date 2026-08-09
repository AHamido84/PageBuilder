"use client";

import { useActionState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addLeadNoteAction, deleteLeadNoteAction, type FormActionState } from "../actions";

const initialState: FormActionState = {};

interface Note {
  id: string;
  body: string;
  createdAt: string;
  authorName: string | null;
}

export function LeadNotes({ leadId, notes }: { leadId: string; notes: Note[] }) {
  const [state, formAction, pending] = useActionState(addLeadNoteAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium">Notes</h2>
      <div className="mb-4 space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="rounded-md border border-neutral-800 bg-neutral-900 p-3">
            <p className="text-sm text-neutral-200">{note.body}</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                {note.authorName ?? "System"} · {new Date(note.createdAt).toLocaleString()}
              </p>
              <button
                type="button"
                onClick={() => startTransition(async () => { await deleteLeadNoteAction(note.id, leadId); router.refresh(); })}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {notes.length === 0 ? <p className="text-sm text-neutral-500">No notes yet.</p> : null}
      </div>
      <form ref={formRef} action={formAction} className="space-y-2">
        <input type="hidden" name="leadId" value={leadId} />
        <textarea name="body" required rows={3} placeholder="Add a note..." className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm" />
        {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60">
          {pending ? "Adding..." : "Add note"}
        </button>
      </form>
    </div>
  );
}
