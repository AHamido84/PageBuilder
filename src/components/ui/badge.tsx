import { cn } from "@/lib/cn";

type BadgeTone = "ink" | "harbor" | "wheat" | "signal" | "frost" | "featured" | "new";

const toneClasses: Record<BadgeTone, string> = {
  ink: "bg-ink text-paper",
  harbor: "bg-harbor text-paper",
  wheat: "bg-wheat-soft text-ink",
  signal: "bg-signal-soft text-signal",
  frost: "bg-frost text-ink",
  featured: "bg-wheat text-ink",
  new: "bg-harbor text-paper",
};

export function Badge({ tone = "frost", className, ...props }: { tone?: BadgeTone } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "manifest-strip inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

const TEMPERATURE_TONE: Record<string, BadgeTone> = {
  FROZEN: "harbor",
  CHILLED: "frost",
  AMBIENT: "wheat",
};

const TEMPERATURE_LABEL_EN: Record<string, string> = {
  FROZEN: "Frozen",
  CHILLED: "Chilled",
  AMBIENT: "Ambient",
};

const TEMPERATURE_LABEL_AR: Record<string, string> = {
  FROZEN: "مجمد",
  CHILLED: "مبرد",
  AMBIENT: "عادي",
};

export function TemperatureBadge({ value, locale }: { value: string; locale: string }) {
  const label = locale === "ar" ? TEMPERATURE_LABEL_AR[value] : TEMPERATURE_LABEL_EN[value];
  return <Badge tone={TEMPERATURE_TONE[value] ?? "frost"}>{label ?? value}</Badge>;
}
