"use client";

import { StyledTextField } from "@/components/admin/text/styled-text-field";
import { setRich, type RichMap, type RichText } from "@/lib/text-style/rich-text";

const inputClass = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-neutral-400";

interface FieldWrapProps {
  label?: string;
  dir?: "ltr" | "rtl";
  className?: string;
  children: React.ReactNode;
}

function FieldWrap({ label, className, children }: FieldWrapProps) {
  return (
    <div className={className}>
      {label ? <label className={labelClass}>{label}</label> : null}
      {children}
    </div>
  );
}

/** Text styling (opt-in): pass `rich` + `onChangeRich` (see `styledProps`) to get the styled editor. */
interface StyledProps {
  rich?: RichText | null;
  onChangeRich?: (value: string, rich: RichText | undefined) => void;
}

interface TextFieldProps extends StyledProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  className?: string;
}

/**
 * Props for a styled field stored as `obj[key]` (plain string) + `obj.__rich[key]` (RichText):
 *   <TextField label="Heading" {...styledProps(data, "heading", onChange)} dir={dir} />
 * Text and styling change together in ONE update, so they can never race each other.
 */
export function styledProps<T extends object>(obj: T, key: keyof T & string, apply: (next: T) => void) {
  const record = obj as T & { __rich?: RichMap };
  return {
    value: typeof obj[key] === "string" ? (obj[key] as string) : "",
    rich: record.__rich?.[key],
    onChange: (value: string) => apply({ ...obj, [key]: value }),
    onChangeRich: (value: string, rich: RichText | undefined) => apply({ ...obj, [key]: value, __rich: setRich(record.__rich, key, rich) }),
  };
}

export function TextField({ label, value, onChange, placeholder, dir, className, rich, onChangeRich }: TextFieldProps) {
  if (onChangeRich) {
    return (
      <div className={className}>
        <StyledTextField label={label} value={value} rich={rich} onChange={onChangeRich} dir={dir} placeholder={placeholder} />
      </div>
    );
  }
  return (
    <FieldWrap label={label} className={className}>
      <input type="text" dir={dir} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </FieldWrap>
  );
}

interface TextareaFieldProps extends StyledProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  rows?: number;
  className?: string;
}

export function TextareaField({ label, value, onChange, placeholder, dir, rows = 4, className, rich, onChangeRich }: TextareaFieldProps) {
  if (onChangeRich) {
    return (
      <div className={className}>
        <StyledTextField label={label} value={value} rich={rich} onChange={onChangeRich} dir={dir} placeholder={placeholder} multiline />
      </div>
    );
  }
  return (
    <FieldWrap label={label} className={className}>
      <textarea dir={dir} value={value} placeholder={placeholder} rows={rows} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </FieldWrap>
  );
}

interface SelectFieldProps<T extends string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}

export function SelectField<T extends string>({ label, value, onChange, options, className }: SelectFieldProps<T>) {
  return (
    <FieldWrap label={label} className={className}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className={inputClass}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}

interface NumberFieldProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function NumberField({ label, value, onChange, min, max, className }: NumberFieldProps) {
  // Phase 11 QA fix: the `min`/`max` attributes below only constrain the spinner arrows and native
  // validity state -- they do NOT stop a typed value from exceeding the range (e.g. a focal-point
  // field with min=0/max=100 happily accepted "5015", which is a valid CSS percentage but pushes an
  // image's object-position entirely out of its visible box, silently "disappearing" it with no
  // error shown anywhere). Clamped on blur, not on every keystroke, so typing multi-digit numbers
  // (e.g. "1" then "5" to reach "15") is never interrupted mid-entry.
  function handleBlur() {
    if (min === undefined && max === undefined) return;
    let clamped = value;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    if (clamped !== value) onChange(clamped);
  }
  return (
    <FieldWrap label={label} className={className}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={handleBlur}
        className={inputClass}
      />
    </FieldWrap>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function CheckboxField({ label, checked, onChange, className }: CheckboxFieldProps) {
  return (
    <label className={`flex items-center gap-2 text-sm text-neutral-300 ${className ?? ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-neutral-600 bg-neutral-800" />
      {label}
    </label>
  );
}
