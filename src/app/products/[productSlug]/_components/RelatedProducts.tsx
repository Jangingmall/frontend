import { ProductCard } from "@/components/product/ProductCard";
import type { ProductSummary } from "@/types/product";

interface RelatedProductsProps {
  products: ProductSummary[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products.length) return null;
  return (
    <section
      aria-labelledby="related-products-title"
      className="mt-6 border-t border-border-neutral-weak pt-4"
    >
      <h2 id="related-products-title" className="mb-4 px-2 text-title-l">
        작가의 다른 작품
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            product={{ ...product, colors: undefined }}
          />
        ))}
      </div>
    </section>
  );
}
