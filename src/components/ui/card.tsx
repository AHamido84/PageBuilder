import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-ink/10 bg-paper shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-lifted)]",
        className
      )}
      {...props}
    />
  );
}
