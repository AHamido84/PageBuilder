"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Underline as UnderlineIcon } from "lucide-react";
import { IconButton } from "@/components/admin/ui/icon-button";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveBodyClasses } from "../../style-tokens";
import type { RichTextData } from "../content-blocks";

export function RichTextEdit({ data, onChange, locale }: BlockEditProps<RichTextData>) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false }), Link.configure({ openOnClick: false })],
    content: data.html,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange({ html: editor.getHTML() }),
  });

  if (!editor) return null;

  return (
    <div className="rounded-md border border-neutral-700 bg-neutral-800">
      <div className="flex items-center gap-1 border-b border-neutral-700 p-1.5">
        <IconButton icon={Bold} label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <IconButton icon={Italic} label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <IconButton icon={UnderlineIcon} label="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <IconButton icon={List} label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <IconButton icon={ListOrdered} label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <IconButton
          icon={LinkIcon}
          label="Link"
          active={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
            else editor.chain().focus().unsetLink().run();
          }}
        />
      </div>
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="max-w-none px-3 py-2 text-sm text-neutral-100 [&_.ProseMirror]:min-h-24 [&_.ProseMirror]:outline-none [&_a]:text-neutral-300 [&_a]:underline [&_ol]:list-decimal [&_ol]:ps-5 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:ps-5"
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export function RichTextRender({ data, settings }: BlockRenderProps<RichTextData>) {
  return (
    <div
      className={`max-w-none leading-relaxed [&_a]:underline [&_a]:opacity-80 [&_ol]:list-decimal [&_ol]:ps-5 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:ps-5 ${resolveBodyClasses(settings)}`}
      // Trusted: data.html is sanitized server-side (sanitize-html) in saveDraftAction before persisting. Never re-sanitized here — see saveDraftAction.
      dangerouslySetInnerHTML={{ __html: data.html }}
    />
  );
}
