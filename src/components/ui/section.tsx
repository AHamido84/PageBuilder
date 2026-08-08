import { cn } from "@/lib/cn";
import { Container } from "./container";

type SectionTone = "paper" | "ink" | "harbor" | "frost";

const toneClasses: Record<SectionTone, string> = {
  paper: "bg-paper text-ink",
  ink: "bg-ink text-paper",
  harbor: "bg-harbor-soft text-ink",
  frost: "bg-frost text-ink",
};

interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  tone?: SectionTone;
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  containerClassName?: string;
}

export function Section({
  tone = "paper",
  eyebrow,
  title,
  description,
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("border-t border-ink/10 py-16 sm:py-20 lg:py-28", toneClasses[tone], className)} {...props}>
      <Container className={containerClassName}>
        {(eyebrow || title || description) && (
          <div className="mb-10 max-w-2xl sm:mb-14">
            {eyebrow ? <p className="manifest-strip mb-3 text-harbor">{eyebrow}</p> : null}
            {title ? <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.05]">{title}</h2> : null}
            {description ? <p className="mt-4 text-base leading-relaxed text-ink/70 sm:text-lg">{description}</p> : null}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
