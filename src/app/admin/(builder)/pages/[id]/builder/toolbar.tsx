"use client";

import Link from "next/link";
import { ArrowLeft, Eye, History, Laptop, MousePointer2, Redo2, Smartphone, Tablet, Undo2 } from "lucide-react";
import { SegmentedControl } from "@/components/admin/ui/segmented-control";
import { StatusLabel, type SaveStatus } from "@/components/admin/ui/status-label";
import type { Breakpoint } from "@/lib/page-builder/types";

interface Props {
  pageId: string;
  slug: string;
  pageStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  saveStatus: SaveStatus;
  device: Breakpoint;
  onDeviceChange: (d: Breakpoint) => void;
  mode: "select" | "preview";
  onModeChange: (m: "select" | "preview") => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPublish: () => void;
  publishing: boolean;
  onOpenRevisions: () => void;
}

export function Toolbar({ pageId, slug, pageStatus, saveStatus, device, onDeviceChange, mode, onModeChange, canUndo, canRedo, onUndo, onRedo, onSave, onPublish, publishing, onOpenRevisions }: Props) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-3">
      <div className="flex items-center gap-3">
        <Link href={`/admin/pages/${pageId}`} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-sm font-medium leading-tight">/{slug}</p>
          <p className="text-[11px] leading-tight text-neutral-500">
            {pageStatus} · <StatusLabel status={saveStatus} />
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SegmentedControl
          value={device}
          onChange={onDeviceChange}
          options={[
            { value: "mobile", label: "", icon: <Smartphone size={14} /> },
            { value: "tablet", label: "", icon: <Tablet size={14} /> },
            { value: "desktop", label: "", icon: <Laptop size={14} /> },
          ]}
        />
        <SegmentedControl
          value={mode}
          onChange={onModeChange}
          options={[
            { value: "select", label: "Select", icon: <MousePointer2 size={14} /> },
            { value: "preview", label: "Preview", icon: <Eye size={14} /> },
          ]}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <button type="button" disabled={!canUndo} onClick={onUndo} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100 disabled:opacity-30" title="Undo">
          <Undo2 size={16} />
        </button>
        <button type="button" disabled={!canRedo} onClick={onRedo} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100 disabled:opacity-30" title="Redo">
          <Redo2 size={16} />
        </button>
        <button type="button" onClick={onOpenRevisions} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100" title="Revision history">
          <History size={16} />
        </button>
        <a href={`/en/${slug}`} target="_blank" rel="noreferrer" className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900">
          Preview
        </a>
        <button type="button" onClick={onSave} className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900">
          Save
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={publishing}
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-white disabled:opacity-60"
        >
          {publishing ? "Publishing…" : "Publish"}
        </button>
      </div>
    </div>
  );
}
