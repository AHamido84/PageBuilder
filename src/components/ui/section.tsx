import { cn } from "@/lib/cn";
import { Container } from "./container";
import { ScrollReveal } from "@/lib/motion/primitives";

type SectionTone = "paper" | "ink" | "harbor" | "frost";

const toneClasses: Record<SectionTone, string> = {
  paper: "bg-paper text-ink",
  ink: "bg-ink text-paper",
  harbor: "bg-harbor-soft text-ink",
  frost: "bg-frost text-ink",
};

interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  tone?: SectionTone;
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  containerClassName?: string;
  /** "h1" when this section's title is the page title (index pages); same styling either way. */
  titleAs?: "h1" | "h2";
}

export function Section({
  tone = "paper",
  eyebrow,
  title,
  description,
  className,
  containerClassName,
  titleAs: TitleTag = "h2",
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("border-t border-line py-14 sm:py-20 lg:py-32", toneClasses[tone], className)} {...props}>
      <Container className={containerClassName}>
        {(eyebrow || title || description) && (
          <ScrollReveal variant="fade-up" className="mb-12 max-w-2xl sm:mb-16">
            {eyebrow ? <p className="manifest-strip mb-3 text-harbor">{eyebrow}</p> : null}
            {title ? <TitleTag className="font-display text-h2">{title}</TitleTag> : null}
            {description ? <p className="mt-4 text-base leading-relaxed text-ink/70 sm:text-lg">{description}</p> : null}
          </ScrollReveal>
        )}
        {children}
      </Container>
    </section>
  );
}
