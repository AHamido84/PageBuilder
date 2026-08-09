"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  danger?: boolean;
}

export function IconButton({ icon: Icon, label, active, danger, className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
        active ? "border-neutral-500 bg-neutral-700 text-neutral-100" : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
        danger && "hover:border-red-800 hover:bg-red-950 hover:text-red-300",
        className
      )}
      {...props}
    >
      <Icon size={14} />
    </button>
  );
}
