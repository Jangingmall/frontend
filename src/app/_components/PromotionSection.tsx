import { ProductCard } from "@/components/product/ProductCard";
import type { ProductSummary } from "@/types/product";

import { SectionHeader } from "./SectionHeader";

/**
 * 홈 "기획전" 섹션 — IA 명시대로 더미 데이터만 노출하고 카드·전체보기 클릭은 비활성이다
 * (design.md §0.2 "기획전"). 다른 상품 섹션과 똑같이 `ProductCard`를 그대로 쓴다(Figma
 * `product-comp` 인스턴스와 동일 컴포넌트) — 초기 구현은 `<Link>`를 못 쓴다는 이유로 이미지·
 * 이름·가격만 있는 별도 마크업을 새로 그렸는데, 그러면 이 섹션만 다른 카드처럼 안 보인다.
 * 대신 각 카드를 `inert`로 감싼다 — 클릭·포커스·키보드 진입을 전부 막으면서(마우스만 막는
 * `pointer-events-none`과 달리 Tab·Enter도 막는다) 시각은 `ProductCard` 그대로 유지한다.
 */
export function PromotionSection({
  items,
}: {
  items: readonly ProductSummary[];
}) {
  return (
    <section
      aria-label="기획전"
      className="mx-auto w-full max-w-desktop page-gutter py-6 md:py-10.5 lg:py-13"
    >
      <SectionHeader
        title="기획전"
        description="장인의 물건이 전부 비싼 건 아닙니다. 손이 덜 가는 물건은 그만큼의 값으로 냅니다"
        viewAll={{ disabled: true }}
      />
      <div className="relative mt-6 flex gap-1 overflow-x-auto pb-3 md:gap-3 lg:gap-4 2xl:gap-6 2xl:pb-0">
        {items.map((product) => (
          <div
            key={product.id}
            inert
            className="w-36 shrink-0 md:w-65 xl:w-79.5"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
