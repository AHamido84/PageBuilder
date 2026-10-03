"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { MediaBrowser } from "@/components/admin/media/media-browser";
import { acceptAttrFor as acceptAttrForKind, type MediaItem, type MediaKind } from "@/lib/media/upload-client";

/** Kept as the name every picker already imports; it's the full Media Library item shape. */
export type MediaListItem = MediaItem;

type Accept = MediaKind;

export function acceptAttrFor(accept: Accept): string {
  return acceptAttrForKind(accept);
}

interface BaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  accept: Accept;
  /** ids to show with a persistent "Current" highlight in the grid. */
  selectedIds: string[];
  /** Folder new uploads go into by default, e.g. "Brands" -- see the default folders migration. */
  uploadFolderName?: string;
}

interface SingleSelectProps extends BaseProps {
  multi?: false;
  onSelect: (item: MediaListItem) => void;
}

interface MultiSelectProps extends BaseProps {
  multi: true;
  /** Called once with every picked item when the admin confirms -- lets a caller (e.g. bulk-adding Hero slides) add several at once instead of reopening the picker per image. */
  onConfirm: (items: MediaListItem[]) => void;
}

type MediaLibraryModalProps = SingleSelectProps | MultiSelectProps;

/**
 * The Media Library in a modal -- behind every media field in the admin (`MediaPickerField`,
 * `MediaPickerControlled`, `MultiMediaPickerButton`): folders, search, drag-and-drop upload with
 * progress, preview, then Select. The browser is only mounted while open, so each open starts fresh.
 */
export function MediaLibraryModal(props: MediaLibraryModalProps) {
  const { open, onClose, title, accept, selectedIds, uploadFolderName } = props;

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-6xl">
      {open ? (
        <MediaBrowser
          mode="pick"
          accept={accept}
          multi={props.multi}
          selectedIds={selectedIds}
          uploadFolderName={uploadFolderName}
          onPick={(items) => {
            if (props.multi) props.onConfirm(items);
            else if (items[0]) props.onSelect(items[0]);
            onClose();
          }}
        />
      ) : null}
    </Modal>
  );
}

/** A button + its own multi-select MediaLibraryModal, for bulk-picking several files in one
 * open/close cycle (e.g. adding many Hero slides at once instead of opening a single-select picker
 * once per slide). `onConfirm` fires once with everything picked. */
export function MultiMediaPickerButton({
  label,
  accept = "IMAGE",
  className,
  uploadFolderName,
  onConfirm,
}: {
  label: string;
  accept?: Accept;
  className?: string;
  uploadFolderName?: string;
  onConfirm: (items: MediaListItem[]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"}
      >
        {label}
      </button>
      <MediaLibraryModal
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        accept={accept}
        selectedIds={[]}
        uploadFolderName={uploadFolderName}
        multi
        onConfirm={onConfirm}
      />
    </>
  );
}
