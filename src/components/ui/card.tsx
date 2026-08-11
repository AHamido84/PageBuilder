import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-ink/10 bg-paper shadow-[var(--shadow-flat)] transition-[box-shadow,transform] duration-300 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    />
  );
}
