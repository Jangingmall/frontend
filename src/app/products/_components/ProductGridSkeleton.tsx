import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton() {
  return (
    <div
      role="status"
      aria-label="상품 불러오는 중"
      className="grid grid-cols-2 gap-x-6 gap-y-6 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-full" />
        </div>
      ))}
    </div>
  );
}
