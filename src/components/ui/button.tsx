import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost-light" | "ghost-dark";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium tracking-[-0.01em] transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-premium)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:shadow-[var(--shadow-focus)]";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-wheat text-ink shadow-[var(--shadow-flat)] hover:bg-ink hover:text-paper hover:shadow-[var(--shadow-card)]",
  secondary: "border border-ink/70 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  "ghost-light": "border border-paper/40 text-paper hover:border-paper hover:bg-paper hover:text-ink",
  "ghost-dark": "text-ink hover:text-harbor",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}
