"use client";

export type SaveStatus = "saved" | "saving" | "dirty" | "error" | "conflict";

const TEXT: Record<SaveStatus, string> = {
  saved: "Saved",
  saving: "Saving…",
  dirty: "Unsaved changes",
  error: "Save failed",
  conflict: "Changed elsewhere — reload",
};

const COLOR: Record<SaveStatus, string> = {
  saved: "text-emerald-400",
  saving: "text-neutral-400",
  dirty: "text-amber-400",
  error: "text-red-400",
  conflict: "text-red-400",
};

export function StatusLabel({ status }: { status: SaveStatus }) {
  return <span className={`text-xs ${COLOR[status]}`}>{TEXT[status]}</span>;
}
