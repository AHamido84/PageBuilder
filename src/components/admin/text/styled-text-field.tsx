"use client";

import { useEffect, useRef, useState } from "react";
import { Extension } from "@tiptap/core";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { Bold, Italic, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  COLOR_TOKENS,
  PX_MAX,
  PX_MIN,
  SIZE_LABELS,
  SIZE_TOKENS,
  colorCss,
  colorHex,
  hasStyling,
  normalizeDoc,
  plainToDoc,
  richToPlain,
  type RichText,
  type SizeValue,
  type TextStyle as FieldStyle,
} from "@/lib/text-style/rich-text";

/**
 * <StyledTextField> -- one admin text input with styling (feat/text-styling).
 *
 *  - Nothing selected: B / I / color / size apply to the WHOLE field («النص كاملًا»).
 *  - Text selected: they apply to that part only (e.g. «يليق» in gold).
 *  - «إرجاع للافتراضي» clears all styling (the text stays).
 * Emits `onChange(plain, rich)`; `rich` is undefined while the field has no styling at all, so an
 * untouched field stays a plain string. Short mode = one line, no breaks; long = paragraphs + breaks.
 * With `name`, also renders hidden inputs (`name` = plain text, `name__rich` = JSON) for plain
 * <form action> submission.
 */

/** Inline size as a textStyle attribute, rendered with the site's own `ts-*` classes in the editor. */
const InlineSize = Extension.create({
  name: "inlineSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.getAttribute("data-size"),
            renderHTML: (attrs) => {
              const v = attrs.fontSize as string | null;
              if (!v) return {};
              return v.endsWith("px") ? { "data-size": v, style: `font-size: ${v}` } : { "data-size": v, class: `ts-${v}` };
            },
          },
        },
      },
    ];
  },
});

const SingleLine = Extension.create({
  name: "singleLine",
  addKeyboardShortcuts() {
    return { Enter: () => true, "Shift-Enter": () => true };
  },
});

const RECENT_KEY = "ts-recent-colors";
function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).filter((c) => /^#[0-9a-fA-F]{6}$/.test(c)).slice(0, 6) : [];
  } catch {
    return [];
  }
}
function pushRecent(color: string) {
  try {
    const next = [color, ...readRecent().filter((c) => c.toLowerCase() !== color.toLowerCase())].slice(0, 6);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable -- recent colors are a convenience only */
  }
}

export interface StyledTextFieldProps {
  label?: string;
  value: string;
  rich?: RichText | null;
  onChange: (value: string, rich: RichText | undefined) => void;
  multiline?: boolean;
  dir?: "rtl" | "ltr";
  placeholder?: string;
  /** Hidden inputs for <form action> submission: `name` (plain) + `name__rich` (JSON). */
  name?: string;
  id?: string;
}

export function StyledTextField({ label, value, rich, onChange, multiline = false, dir, placeholder, name, id }: StyledTextFieldProps) {
  const [fieldStyle, setFieldStyle] = useState<FieldStyle>(rich?.style ?? {});
  const [current, setCurrent] = useState<{ plain: string; rich: RichText | undefined }>({ plain: value, rich: rich ?? undefined });
  const [hasSelection, setHasSelection] = useState(false);
  const [, force] = useState(0);
  // The editor's onUpdate is created once; it reads the latest whole-field style from this ref.
  const styleRef = useRef(fieldStyle);
  useEffect(() => {
    styleRef.current = fieldStyle;
  }, [fieldStyle]);

  function emit(editor: Editor, style: FieldStyle) {
    const content = normalizeDoc(editor.getJSON(), multiline);
    const next: RichText = { v: 1, ...(Object.keys(style).length ? { style } : {}), content };
    const plain = richToPlain(next);
    const out = hasStyling(next) ? next : undefined;
    setCurrent({ plain, rich: out });
    onChange(plain, out);
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...(multiline ? [] : [Document.extend({ content: "paragraph" }), SingleLine]),
      StarterKit.configure({
        ...(multiline ? {} : { document: false, hardBreak: false }),
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: false,
      }),
      TextStyle,
      Color,
      InlineSize,
    ],
    content: rich?.content ?? plainToDoc(value ?? "", multiline),
    editorProps: {
      attributes: {
        class: cn("outline-none", multiline ? "min-h-[4.5rem]" : "whitespace-pre"),
        ...(dir ? { dir } : {}),
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-multiline": String(multiline),
        ...(label ? { "aria-label": label } : {}),
      },
    },
    onUpdate: ({ editor }) => emit(editor, styleRef.current),
    onSelectionUpdate: ({ editor }) => {
      setHasSelection(!editor.state.selection.empty);
      force((n) => n + 1);
    },
  });

  // Re-seed when the value changes from OUTSIDE (switching item / locale) -- our own echo (the parent
  // passing back what we just emitted) matches `current` and is ignored. Detected during render
  // (React's "adjust state on prop change"); only the editor command runs in the effect.
  const [seed, setSeed] = useState(0);
  const [seen, setSeen] = useState({ value, rich });
  if (seen.value !== value || seen.rich !== rich) {
    setSeen({ value, rich });
    const echo = value === current.plain && JSON.stringify(rich ?? null) === JSON.stringify(current.rich ?? null);
    if (!echo) {
      setFieldStyle(rich?.style ?? {});
      setCurrent({ plain: value, rich: rich ?? undefined });
      setSeed((n) => n + 1);
    }
  }
  useEffect(() => {
    if (!editor || seed === 0) return;
    editor.commands.setContent(current.rich?.content ?? plainToDoc(current.plain ?? "", multiline), { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per external re-seed
  }, [editor, seed]);

  function updateFieldStyle(patch: Partial<FieldStyle>) {
    const next = { ...fieldStyle, ...patch };
    for (const k of Object.keys(next) as (keyof FieldStyle)[]) if (next[k] === undefined || next[k] === false) delete next[k];
    setFieldStyle(next);
    if (editor) emit(editor, next);
  }

  function applyColor(color: string | null) {
    if (!editor) return;
    if (hasSelection) {
      if (color) editor.chain().focus().setColor(colorHex(color)).run();
      else editor.chain().focus().unsetColor().run();
    } else updateFieldStyle({ color: color ?? undefined });
    if (color && /^#/.test(color)) pushRecent(color);
  }

  function applySize(size: SizeValue | null, mobile = false) {
    if (!editor) return;
    if (hasSelection && !mobile) {
      const v = size === null ? null : typeof size === "string" ? size : `${size.px}px`;
      editor.chain().focus().setMark("textStyle", { fontSize: v }).removeEmptyTextStyle().run();
    } else updateFieldStyle(mobile ? { sizeMobile: size ?? undefined } : { size: size ?? undefined });
  }

  function toggle(kind: "bold" | "italic") {
    if (!editor) return;
    if (hasSelection) {
      if (kind === "bold") editor.chain().focus().toggleBold().run();
      else editor.chain().focus().toggleItalic().run();
    } else updateFieldStyle({ [kind]: !fieldStyle[kind] });
  }

  function reset() {
    if (!editor) return;
    editor.chain().focus().selectAll().unsetAllMarks().setTextSelection(editor.state.doc.content.size).run();
    setFieldStyle({});
    emit(editor, {});
  }

  const active = (kind: "bold" | "italic") => (hasSelection ? Boolean(editor?.isActive(kind)) : Boolean(fieldStyle[kind]));
  const previewStyle = {
    ...(fieldStyle.color ? { color: colorCss(fieldStyle.color) } : {}),
    ...(fieldStyle.bold ? { fontWeight: 700 } : {}),
    ...(fieldStyle.italic ? { fontStyle: "italic" as const } : {}),
    ...(fieldStyle.size && typeof fieldStyle.size === "object" ? { fontSize: `${fieldStyle.size.px}px` } : {}),
  };
  const sizeCls = fieldStyle.size && typeof fieldStyle.size === "string" ? `ts-${fieldStyle.size}` : undefined;
  const styled = hasStyling(current.rich);

  return (
    <div data-styled-field>
      {label ? <span className="mb-1 block text-xs text-neutral-400">{label}</span> : null}
      <div className={cn("rounded-md border bg-neutral-800 focus-within:border-amber-500", styled ? "border-amber-700/70" : "border-neutral-700")}>
        <Toolbar
          scope={hasSelection ? "selection" : "field"}
          boldActive={active("bold")}
          italicActive={active("italic")}
          fieldStyle={fieldStyle}
          onBold={() => toggle("bold")}
          onItalic={() => toggle("italic")}
          onColor={applyColor}
          onSize={(s) => applySize(s)}
          onMobileSize={(s) => applySize(s, true)}
          onReset={reset}
          canReset={styled}
        />
        <div className={cn("max-h-64 overflow-y-auto px-2 py-1.5 text-sm text-neutral-100", sizeCls)} style={previewStyle} dir={dir}>
          {editor ? <EditorContent editor={editor} /> : <div className="min-h-5 whitespace-pre-wrap">{value}</div>}
          {!value && placeholder ? <div className="pointer-events-none -mt-5 text-neutral-500">{placeholder}</div> : null}
        </div>
      </div>
      {name ? (
        <>
          <input type="hidden" name={name} value={current.plain} />
          <input type="hidden" name={`${name}__rich`} value={current.rich ? JSON.stringify(current.rich) : ""} />
        </>
      ) : null}
    </div>
  );
}

/** Uncontrolled variant for plain <form action> forms: submits `name` (plain) + `name__rich` (JSON). */
export function StyledFormField({
  name,
  defaultValue,
  defaultRich,
  ...rest
}: Omit<StyledTextFieldProps, "value" | "rich" | "onChange" | "name"> & { name: string; defaultValue?: string | null; defaultRich?: RichText | null }) {
  const [state, setState] = useState<{ value: string; rich: RichText | undefined }>({ value: defaultValue ?? "", rich: defaultRich ?? undefined });
  return <StyledTextField {...rest} name={name} value={state.value} rich={state.rich} onChange={(value, rich) => setState({ value, rich })} />;
}

function Toolbar({
  scope,
  boldActive,
  italicActive,
  fieldStyle,
  onBold,
  onItalic,
  onColor,
  onSize,
  onMobileSize,
  onReset,
  canReset,
}: {
  scope: "selection" | "field";
  boldActive: boolean;
  italicActive: boolean;
  fieldStyle: FieldStyle;
  onBold: () => void;
  onItalic: () => void;
  onColor: (c: string | null) => void;
  onSize: (s: SizeValue | null) => void;
  onMobileSize: (s: SizeValue | null) => void;
  onReset: () => void;
  canReset: boolean;
}) {
  const [recent, setRecent] = useState<string[]>([]);
  const btn = "flex h-7 min-w-7 items-center justify-center rounded px-1 text-neutral-300 hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400";
  return (
    <div dir="rtl" className="flex flex-wrap items-center gap-1 border-b border-neutral-700 px-1.5 py-1 text-xs" onMouseDown={(e) => e.target instanceof HTMLButtonElement && e.preventDefault()}>
      <span className={cn("rounded px-1.5 py-0.5", scope === "selection" ? "bg-amber-900/60 text-amber-200" : "bg-neutral-700 text-neutral-300")} title="بدون تحديد: التنسيق للنص كاملًا. حدّد جزءًا لتنسيقه وحده.">
        {scope === "selection" ? "التحديد" : "النص كاملًا"}
      </span>
      <button type="button" className={cn(btn, boldActive && "bg-neutral-600 text-white")} title="عريض (Ctrl+B)" aria-label="عريض" aria-pressed={boldActive} onClick={onBold}>
        <Bold size={14} />
      </button>
      <button type="button" className={cn(btn, italicActive && "bg-neutral-600 text-white")} title="مائل (Ctrl+I)" aria-label="مائل" aria-pressed={italicActive} onClick={onItalic}>
        <Italic size={14} />
      </button>
      <span className="mx-0.5 h-4 w-px bg-neutral-700" aria-hidden="true" />
      {(Object.keys(COLOR_TOKENS) as (keyof typeof COLOR_TOKENS)[]).map((key) => (
        <button
          key={key}
          type="button"
          title={`اللون: ${COLOR_TOKENS[key].label}`}
          aria-label={`اللون: ${COLOR_TOKENS[key].label}`}
          aria-pressed={scope === "field" && fieldStyle.color === key}
          onClick={() => onColor(key)}
          className={cn("h-5 w-5 rounded-full border border-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400", scope === "field" && fieldStyle.color === key && "ring-2 ring-amber-400")}
          style={{ backgroundColor: COLOR_TOKENS[key].hex }}
        />
      ))}
      <label className={cn(btn, "relative cursor-pointer")} title="لون مخصص" onFocus={() => setRecent(readRecent())} onMouseEnter={() => setRecent(readRecent())}>
        <span aria-hidden="true">🎨</span>
        <span className="sr-only">لون مخصص</span>
        <input type="color" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => onColor(e.target.value)} />
      </label>
      {recent.map((c) => (
        <button key={c} type="button" title={`لون حديث ${c}`} aria-label={`لون حديث ${c}`} onClick={() => onColor(c)} className="h-4 w-4 rounded-sm border border-neutral-600" style={{ backgroundColor: c }} />
      ))}
      <button type="button" className={btn} title="إزالة اللون" aria-label="إزالة اللون" onClick={() => onColor(null)}>
        ⌀
      </button>
      <span className="mx-0.5 h-4 w-px bg-neutral-700" aria-hidden="true" />
      <SizeSelect label="الحجم" value={scope === "field" ? fieldStyle.size : undefined} onChange={onSize} />
      {scope === "field" ? <SizeSelect label="الجوال" value={fieldStyle.sizeMobile} onChange={onMobileSize} /> : null}
      <button type="button" className={cn(btn, "ms-auto gap-1 px-1.5 disabled:opacity-40")} disabled={!canReset} onClick={onReset} title="إرجاع للافتراضي">
        <RotateCcw size={12} />
        <span>إرجاع للافتراضي</span>
      </button>
    </div>
  );
}

function SizeSelect({ label, value, onChange }: { label: string; value: SizeValue | undefined; onChange: (s: SizeValue | null) => void }) {
  const current = value === undefined ? "" : typeof value === "string" ? value : "px";
  return (
    <span className="flex items-center gap-1">
      <select
        aria-label={label}
        title={label}
        value={current}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) onChange(null);
          else if (v === "px") {
            const raw = window.prompt(`حجم مخصص بالبكسل (${PX_MIN}–${PX_MAX})`, "24");
            const px = Math.round(Number(raw));
            if (Number.isFinite(px) && px >= PX_MIN && px <= PX_MAX) onChange({ px });
          } else onChange(v as SizeValue);
        }}
        className="h-7 rounded border border-neutral-700 bg-neutral-900 px-1 text-xs text-neutral-200"
      >
        <option value="">{label}: افتراضي</option>
        {SIZE_TOKENS.map((t) => (
          <option key={t} value={t}>
            {label}: {SIZE_LABELS[t]}
          </option>
        ))}
        <option value="px">{label}: {typeof value === "object" && value ? `${value.px}px` : "مخصص (px)…"}</option>
      </select>
    </span>
  );
}
