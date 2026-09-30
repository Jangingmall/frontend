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
      <h2
        id="related-products-title"
        className="mb-4 px-2 text-title-l leading-[1.3] font-bold"
      >
        작가의 다른 작품
      </h2>
      {/* 카드는 브레이크포인트별 고정 폭이라 xl 이상에서만 3장이 한 줄에 들어오고, 그보다 좁으면 가로 스크롤
          행이 된다(시안 lg 이하). `relative`: 카드 안 `sr-only`(absolute)가 스크롤 영역 밖에 놓여 페이지
          가로 스크롤을 만들지 않게 이 행을 위치 기준으로 만든다. */}
      <div className="relative flex gap-3 overflow-x-auto pb-3 md:gap-4 xl:gap-4.5 xl:pb-0 2xl:gap-3.75">
        {products.slice(0, 3).map((product) => (
          <div key={product.id} className="w-40 shrink-0 md:w-60.5 xl:w-62">
            <ProductCard
              variant="related"
              product={{ ...product, colors: undefined }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
