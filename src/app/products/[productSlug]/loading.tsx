import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div
      role="status"
      aria-label="상품 상세 불러오는 중"
      className="mx-auto grid w-full max-w-desktop gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,774fr)_minmax(0,522fr)] lg:px-12"
    >
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}
