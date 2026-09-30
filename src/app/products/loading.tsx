import { ProductGridSkeleton } from "@/components/product/ProductGridSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-desktop page-gutter py-12 md:py-16">
      <ProductGridSkeleton layout="catalog" />
    </div>
  );
}
