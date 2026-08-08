import { cn } from "@/lib/cn";

interface StateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: StateProps) {
  return (
    <div className={cn("rounded-[var(--radius-md)] border border-dashed border-ink/20 px-6 py-16 text-center", className)}>
      <p className="font-display text-xl">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, description, action, className }: StateProps) {
  return (
    <div className={cn("rounded-[var(--radius-md)] border border-signal/30 bg-signal-soft px-6 py-16 text-center", className)}>
      <p className="font-display text-xl text-signal">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-ink/70">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
