"use client";

import { cn } from "@/lib/cn";

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  className?: string;
}

export function SegmentedControl<T extends string>({ value, onChange, options, className }: SegmentedControlProps<T>) {
  return (
    <div className={cn("inline-flex rounded-md border border-neutral-800 bg-neutral-900 p-0.5", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
            value === opt.value ? "bg-neutral-700 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
