import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

import { SectionHeader } from "./SectionHeader";

interface ProductCarouselSectionProps {
  title: string;
  description: string;
  /**
   * `/products?preset=` Route Map 계약(docs/routing-and-auth.md §2.1). PL-1(목록 화면)이
   * 아직 이 파라미터를 안 읽어 지금은 클릭해도 필터 없는 전체 목록으로 간다(design.md §4-3,
   * 목록 화면 작업에서 해소).
   */
  viewAllPreset: "best" | "new";
  /** 카드 개수(레이아웃 열 수와 일치). 베스트 5 / 신상품 4 — Figma 실측 카드 폭·행 간격도 다르다. */
  columns: 4 | 5;
  data?: Page<ProductSummary>;
}

/**
 * 베스트·신상품 공용 섹션(design.md §3) — 제목 + 설명 + 카드 1행 + 전체보기.
 * 서버 조회 실패·결과 없음이면 섹션 자체를 렌더링하지 않는다 — 홈은 비핵심 마케팅
 * 화면이라 ErrorState로 막지 않고 조용히 숨긴다(design.md §2).
 *
 * 카드 행 간격은 Figma 실측대로 베스트(5장·256px 카드)는 16px, 신상품(4장·318px 카드)은
 * 24px로 다르다 — 하나로 통일하면 두 섹션 다 카드 폭이 Figma와 어긋난다.
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
      className="mx-auto w-full max-w-desktop page-gutter py-6 md:py-10.5 lg:py-13"
    >
      <SectionHeader
        title={title}
        description={description}
        viewAll={{
          href: { pathname: "/products", query: { preset: viewAllPreset } },
        }}
      />
      <div
        className={cn(
          // 카드는 브레이크포인트별 고정 폭이라 2xl에서만 한 줄에 다 들어오고(스크롤바 없음),
          // 그보다 좁으면 가로 스크롤 행이 된다(시안 xl 이하).
          "mt-6 flex overflow-x-auto pb-3 2xl:pb-0",
          columns === 5
            ? "gap-3 lg:gap-4"
            : "gap-1 md:gap-3 lg:gap-4 2xl:gap-6",
        )}
      >
        {data.items.map((product, index) => (
          <div
            key={product.id}
            className={cn(
              "shrink-0",
              columns === 5
                ? "w-36 md:w-60.5 xl:w-64"
                : "w-36 md:w-65 xl:w-79.5",
            )}
          >
            <ProductCard product={product} isAboveFold={index < columns} />
          </div>
        ))}
      </div>
    </section>
  );
}
