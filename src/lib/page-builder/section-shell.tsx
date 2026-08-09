import { cn } from "@/lib/cn";
import type { SectionSettings } from "./types";
import { resolveSectionClasses } from "./style-tokens";
import { Reveal } from "./reveal";

/**
 * Shared wrapper applying a section's responsive style settings + entrance animation.
 * Used by BOTH the public SectionRenderer and the admin canvas, so a section looks
 * identical in both places by construction.
 */
export function SectionShell({ settings, className, children }: { settings: SectionSettings; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("border-t border-ink/10", resolveSectionClasses(settings), className)}>
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <Reveal animation={settings.animation}>{children}</Reveal>
      </div>
    </div>
  );
}
