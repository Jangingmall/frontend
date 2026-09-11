import { ProductGridSkeleton } from "./_components/ProductGridSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-desktop px-4 py-16 lg:px-12">
      <ProductGridSkeleton />
    </div>
  );
}
