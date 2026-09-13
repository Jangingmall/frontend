import { PROMOTION_PRODUCTS } from "@/app/_lib/promotion-fixtures";

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
      className="mx-auto w-full max-w-desktop px-4 py-12 sm:px-8 lg:px-12"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-title-l">기획전</h2>
          <p className="mt-1 text-body-m text-font-dark-subtle">
            장인의 물건이 전부 비싼 건 아닙니다. 손이 덜 가는 물건은 그만큼의
            값으로 냅니다
          </p>
        </div>
        <span
          aria-disabled="true"
          className="shrink-0 text-body-s text-font-dark-subtle"
        >
          전체보기
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
        {PROMOTION_PRODUCTS.map((product) => (
          <article key={product.id} className="min-w-0 pb-2">
            <div
              aria-hidden="true"
              className="aspect-square w-full bg-fill-jade-weak"
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
