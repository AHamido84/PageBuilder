"use client";

import { useState } from "react";
import { Folder, FolderOpen, Inbox, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/ui/toast";
import type { FolderListResponse } from "@/lib/media/upload-client";

/** "all" | "unfiled" | a MediaFolder id. */
export type FolderFilter = string;
export const ALL_FOLDERS = "all";
export const UNFILED = "unfiled";

interface Props {
  data: FolderListResponse | null;
  value: FolderFilter;
  onChange: (value: FolderFilter) => void;
  /** Create/rename/delete controls -- shown on the Media Library page, hidden inside pickers. */
  manage?: boolean;
  onFoldersChanged: () => void;
}

export function FolderSidebar({ data, value, onChange, manage, onFoldersChanged }: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const confirm = useConfirm();
  const toast = useAdminToast();

  async function send(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      toast.push({ title: json?.error ?? `Request failed (HTTP ${res.status})`, tone: "error" });
      return null;
    }
    return json;
  }

  async function createFolder() {
    const name = newName.trim();
    if (!name) return setCreating(false);
    const json = await send("/api/admin/media/folders", "POST", { name });
    if (json) {
      setNewName("");
      setCreating(false);
      onFoldersChanged();
      onChange(json.folder.id);
    }
  }

  async function renameFolder(id: string) {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name) return;
    if (await send(`/api/admin/media/folders/${id}`, "PATCH", { name })) onFoldersChanged();
  }

  async function deleteFolder(id: string, name: string, count: number) {
    const ok = await confirm({
      title: `Delete folder "${name}"?`,
      description:
        count > 0
          ? `No files are deleted. The ${count} file${count === 1 ? "" : "s"} inside will move to "Unfiled".`
          : "The folder is empty.",
      confirmLabel: "Delete folder",
      danger: true,
    });
    if (!ok) return;
    if (await send(`/api/admin/media/folders/${id}`, "DELETE")) {
      toast.push({ title: `Folder "${name}" deleted`, tone: "success" });
      if (value === id) onChange(ALL_FOLDERS);
      onFoldersChanged();
    }
  }

  const row = (key: string, label: string, count: number | undefined, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => onChange(key)}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm transition-colors ${
        value === key ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
      }`}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined ? <span className="text-[11px] tabular-nums text-neutral-500">{count}</span> : null}
    </button>
  );

  return (
    <nav aria-label="Media folders" className="space-y-0.5">
      {row(ALL_FOLDERS, "All files", data?.totalCount, <Layers size={14} className="shrink-0" />)}
      {row(UNFILED, "Unfiled", data?.unfiledCount, <Inbox size={14} className="shrink-0" />)}
      <p className="px-2 pb-1 pt-3 text-[10px] font-medium uppercase tracking-wider text-neutral-600">Folders</p>
      {data?.folders.map((folder) =>
        renamingId === folder.id ? (
          <input
            key={folder.id}
            autoFocus
            value={renameValue}
            maxLength={60}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => renameFolder(folder.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") renameFolder(folder.id);
              if (e.key === "Escape") setRenamingId(null);
            }}
            className="w-full rounded-md border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm"
          />
        ) : (
          <div key={folder.id} className="group relative">
            {row(
              folder.id,
              folder.name,
              folder.count,
              value === folder.id ? <FolderOpen size={14} className="shrink-0" /> : <Folder size={14} className="shrink-0" />
            )}
            {manage ? (
              <div className="absolute inset-y-0 end-7 hidden items-center gap-0.5 group-hover:flex group-focus-within:flex">
                <button
                  type="button"
                  aria-label={`Rename ${folder.name}`}
                  onClick={() => {
                    setRenamingId(folder.id);
                    setRenameValue(folder.name);
                  }}
                  className="rounded p-1 text-neutral-500 hover:bg-neutral-700 hover:text-neutral-200"
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${folder.name}`}
                  onClick={() => deleteFolder(folder.id, folder.name, folder.count)}
                  className="rounded p-1 text-neutral-500 hover:bg-neutral-700 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ) : null}
          </div>
        )
      )}
      {manage ? (
        creating ? (
          <input
            autoFocus
            value={newName}
            maxLength={60}
            placeholder="Folder name"
            onChange={(e) => setNewName(e.target.value)}
            onBlur={createFolder}
            onKeyDown={(e) => {
              if (e.key === "Enter") createFolder();
              if (e.key === "Escape") {
                setNewName("");
                setCreating(false);
              }
            }}
            className="mt-1 w-full rounded-md border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
          >
            <Plus size={14} /> New folder
          </button>
        )
      ) : null}
    </nav>
  );
}
