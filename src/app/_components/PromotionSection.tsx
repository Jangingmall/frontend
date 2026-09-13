import { PROMOTION_PRODUCTS } from "@/app/_lib/promotion-fixtures";

import { SectionHeader } from "./SectionHeader";

/**
 * 홈 "기획전" 섹션 — IA 명시대로 더미 데이터만 노출하고 카드·전체보기 클릭은 비활성이다
 * (design.md §0.2 "기획전"). `components/product/ProductCard`는 내부적으로 `<Link>`를
 * 강제해 이 요구를 만족 못 해 재사용하지 않는다 — 이미지·이름·가격만 있는 클릭 불가능한
 * 전용 마크업.
 */
export function PromotionSection() {
  return (
    <section
      aria-label="기획전"
      className="mx-auto w-full max-w-desktop px-4 py-13 sm:px-8 lg:px-12"
    >
      <SectionHeader
        title="기획전"
        description="장인의 물건이 전부 비싼 건 아닙니다. 손이 덜 가는 물건은 그만큼의 값으로 냅니다"
        viewAll={{ disabled: true }}
      />
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
        {PROMOTION_PRODUCTS.map((product) => (
          <article key={product.id} className="min-w-0 pb-2">
            <div
              aria-hidden="true"
              className="bg-skeleton aspect-square w-full"
            />
            <p className="mt-2 truncate text-title-m">{product.name}</p>
            <p className="mt-1 text-body-m">
              {product.price.toLocaleString("ko-KR")}원
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
