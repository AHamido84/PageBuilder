import { Container } from "@/components/ui/container";
import { ProductCardSkeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="border-t border-ink/10 py-16 sm:py-20 lg:py-28">
      <Container>
        <div className="mb-10 h-10 w-64 animate-pulse rounded bg-ink/10 sm:mb-14" />
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </div>
  );
}
