"use client";

import { usePathname } from "next/navigation";

/** Shown on top of a page rendered from its unpublished draft (see render-page.ts), so an editor can never mistake it for the live page. */
export function DraftPreviewBanner() {
  const pathname = usePathname();
  return (
    <div
      role="status"
      dir="ltr"
      className="fixed inset-x-0 bottom-0 z-[200] flex flex-wrap items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-sm font-medium text-neutral-950 shadow-lg"
    >
      <span>Draft preview — visitors don&apos;t see these changes until you publish.</span>
      <a href={pathname} className="rounded border border-neutral-950/40 px-2 py-0.5 text-xs hover:bg-neutral-950/10">
        View published version
      </a>
    </div>
  );
}
