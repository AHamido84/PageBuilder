"use client";

import Link from "next/link";
import { ArrowLeft, Eye, History, Laptop, MousePointer2, Redo2, Smartphone, Tablet, Undo2 } from "lucide-react";
import { SegmentedControl } from "@/components/admin/ui/segmented-control";
import { StatusLabel, type SaveStatus } from "@/components/admin/ui/status-label";
import type { Breakpoint } from "@/lib/page-builder/types";
import { HOMEPAGE_SLUG } from "@/lib/page-builder/homepage";
import { publicPathForPageSlug } from "@/lib/page-builder/public-path";

interface Props {
  pageId: string;
  slug: string;
  title?: string | null;
  pageStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  /** PHASE 10: the saved draft differs from what visitors currently see. */
  hasUnpublishedChanges: boolean;
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
  /** Saves the draft, then opens it on the real site (?preview=draft) in a new tab. */
  onPreviewDraft: (locale: "en" | "ar") => void;
  onPublish: () => void;
  publishing: boolean;
  onOpenRevisions: () => void;
}

export function Toolbar({ pageId, slug, title, pageStatus, hasUnpublishedChanges, saveStatus, device, onDeviceChange, mode, onModeChange, canUndo, canRedo, onUndo, onRedo, onSave, onPreviewDraft, onPublish, publishing, onOpenRevisions }: Props) {
  const isHomepage = slug === HOMEPAGE_SLUG;
  const publicPath = publicPathForPageSlug(slug);
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-3">
      <div className="flex items-center gap-3">
        <Link href={`/admin/pages/${pageId}`} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-sm font-medium leading-tight">{title || (isHomepage ? "Homepage (/)" : `/${slug}`)}</p>
          <p className="text-[11px] leading-tight text-neutral-500">
            {pageStatus} · <StatusLabel status={saveStatus} />
            {pageStatus === "PUBLISHED" ? (
              hasUnpublishedChanges ? (
                <span className="ms-1.5 rounded bg-amber-500/15 px-1.5 py-px text-[10px] font-medium text-amber-300" title="The saved draft differs from the live page. Publish to make it live.">
                  Unpublished changes
                </span>
              ) : (
                <span className="ms-1.5 text-[10px] text-neutral-500" title="The live page matches the saved draft.">
                  · Live is up to date
                </span>
              )
            ) : (
              <span className="ms-1.5 text-[10px] text-neutral-500">· Not live yet</span>
            )}
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
        <div className="flex items-center rounded-md border border-neutral-700 text-xs" title="Save, then open the unpublished draft on the real site">
          <span className="px-2 text-neutral-400">Preview draft</span>
          <button type="button" onClick={() => onPreviewDraft("en")} className="border-s border-neutral-700 px-2 py-1.5 text-neutral-300 hover:bg-neutral-900">
            EN
          </button>
          <button type="button" onClick={() => onPreviewDraft("ar")} className="border-s border-neutral-700 px-2 py-1.5 text-neutral-300 hover:bg-neutral-900">
            AR
          </button>
        </div>
        {pageStatus === "PUBLISHED" ? (
          <a href={`/en${publicPath}`} target="_blank" rel="noreferrer" className="px-1 text-xs text-neutral-500 hover:text-neutral-200" title="Open the published page visitors see">
            View live
          </a>
        ) : null}
        <button type="button" onClick={onSave} className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900" title="Save the draft (also saved automatically). Visitors don't see it until you publish.">
          Save draft
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
