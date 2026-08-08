import { cn } from "@/lib/cn";

export function ManifestStrip({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("border-y border-ink/10 bg-ink py-3 text-paper", className)}>
      <p className="manifest-strip mx-auto max-w-[1400px] overflow-x-auto whitespace-nowrap px-5 sm:px-8 lg:px-12">{text}</p>
    </div>
  );
}
