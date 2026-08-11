import { Container } from "@/components/ui/container";

export default function ProductDetailLoading() {
  return (
    <div className="border-t-0 pb-10 pt-10 sm:pb-12 sm:pt-14">
      <Container>
        <div className="mb-6 h-4 w-32 animate-pulse rounded bg-ink/10" />
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="aspect-[4/3] animate-pulse rounded-[var(--radius-lg)] bg-ink/10" />
          <div className="space-y-4">
            <div className="h-3 w-24 animate-pulse rounded bg-ink/10" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-ink/10" />
            <div className="h-4 w-full animate-pulse rounded bg-ink/10" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-ink/10" />
            <div className="mt-8 h-48 animate-pulse rounded-[var(--radius-md)] bg-ink/10" />
          </div>
        </div>
      </Container>
    </div>
  );
}
