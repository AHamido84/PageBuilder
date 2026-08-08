import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-[var(--radius-sm)] bg-ink/10", className)} {...props} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-md)] border border-ink/10 bg-paper p-4">
      <Skeleton className="mb-4 aspect-[4/3] w-full" />
      <Skeleton className="mb-2 h-3 w-1/3" />
      <Skeleton className="mb-1 h-4 w-4/5" />
      <Skeleton className="h-4 w-2/5" />
    </div>
  );
}
