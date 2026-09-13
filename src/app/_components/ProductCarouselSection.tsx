import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

interface ProductCarouselSectionProps {
  title: string;
  description: string;
  /**
   * `/products?preset=` Route Map 계약(docs/routing-and-auth.md §2.1). PL-1(목록 화면)이
   * 아직 이 파라미터를 안 읽어 지금은 클릭해도 필터 없는 전체 목록으로 간다(design.md §4-3,
   * 목록 화면 작업에서 해소).
   */
  viewAllPreset: "best" | "new";
  /** 카드 개수(레이아웃 열 수와 일치). 베스트 5 / 신상품 4. */
  columns: 4 | 5;
  data?: Page<ProductSummary>;
}

/**
 * 베스트·신상품 공용 섹션(design.md §3) — 제목 + 설명 + 카드 1행 + 전체보기.
 * 서버 조회 실패·결과 없음이면 섹션 자체를 렌더링하지 않는다 — 홈은 비핵심 마케팅
 * 화면이라 ErrorState로 막지 않고 조용히 숨긴다(design.md §2).
 */
export function ProductCarouselSection({
  title,
  description,
  viewAllPreset,
  columns,
  data,
}: ProductCarouselSectionProps) {
  if (!data?.items.length) return null;

  return (
    <section
      aria-label={title}
      className="mx-auto w-full max-w-desktop px-4 py-12 sm:px-8 lg:px-12"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-title-l">{title}</h2>
          <p className="mt-1 text-body-m text-font-dark-subtle">
            {description}
          </p>
        </div>
        <Link
          href={{ pathname: "/products", query: { preset: viewAllPreset } }}
          className="shrink-0 text-body-s text-font-dark underline underline-offset-2"
        >
          전체보기
        </Link>
      </div>
      <div
        className={cn(
          "grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4",
          columns === 5 && "lg:grid-cols-5",
        )}
      >
        {data.items.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            isAboveFold={index < columns}
          />
        ))}
      </div>
    </section>
  );
}
