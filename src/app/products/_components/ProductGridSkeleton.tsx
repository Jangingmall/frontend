import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProductGridSkeletonProps {
  isCategoryList?: boolean;
}

export function ProductGridSkeleton({
  isCategoryList = false,
}: ProductGridSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="상품 불러오는 중"
      className={cn(
        "grid grid-cols-2 gap-6 xl:grid-cols-4",
        isCategoryList &&
          "justify-between xl:grid-cols-[repeat(4,minmax(0,16.25rem))]",
      )}
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
