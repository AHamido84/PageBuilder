"use client";

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

interface TextFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  className?: string;
}

export function TextField({ label, value, onChange, placeholder, dir, className }: TextFieldProps) {
  return (
    <FieldWrap label={label} className={className}>
      <input type="text" dir={dir} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </FieldWrap>
  );
}

interface TextareaFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  rows?: number;
  className?: string;
}

export function TextareaField({ label, value, onChange, placeholder, dir, rows = 4, className }: TextareaFieldProps) {
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
  return (
    <FieldWrap label={label} className={className}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
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
