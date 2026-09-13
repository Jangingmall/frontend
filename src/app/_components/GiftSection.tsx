"use client";

import { useEffect, useState } from "react";

import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { startMockWorker } from "@/mocks/start-browser";
import { useProductList } from "@/queries/products/queries";
import type { Page } from "@/types/api";
import { GIFT_THEMES, type GiftThemeId } from "@/types/gift-theme";
import type { ProductSummary } from "@/types/product";

import { SectionHeader } from "./SectionHeader";

const SUGGESTION_SIZE = 3;

interface GiftSectionProps {
  initialTheme: GiftThemeId;
  initialData?: Page<ProductSummary>;
}

/**
 * 홈 "선물" 섹션(design.md §0.2 "선물") — 좌측 테마 토글 2×4(8개, 단일 선택) + 우측 그
 * 선택에 반응하는 상품 추천 3개, 나란히 배치. 초기 설계는 이 8개를 "이미지 타일→링크"로,
 * 배치도 세로로 쌓인 형태로 가정했는데 Figma 실측(`987:25006`, `Gift products container`)
 * 확인 결과 둘 다 틀렸다 — 실제로는 좌우 2단 구성이고 테마는 클라이언트에서 실시간으로
 * 카드를 바꾼다. 섹션 전체 배경도 다른 섹션과 달리 옅은 배경(`bg-subtle`)이 풀블리드로
 * 깔린다.
 *
 * 최초 테마 결과는 `page.tsx`가 서버에서 미리 조회해 `initialData`로 넘겨 첫 페인트를
 * 채운다(`ProductListPage`와 같은 서버 fetch → client `initialData` 패턴).
 *
 * 테마 버튼은 `components/ui/button`의 실제 `Button`(`variant="solid"`/`"ghost"`,
 * `size="s"`)을 쓴다 — Figma 인스턴스 속성을 보니 선택 상태는 `fills` 있음(진한 배경,
 * `solid`), 비선택은 `fills: []`(완전 투명, `ghost`)라 직접 그린 배경·테두리보다 이 매핑이
 * 맞다. 그리드는 `self-start`로 고정해 옆 카드 열이 로딩→실제 카드로 바뀌며 키가 늘어나도
 * (첫 구현의 버그) 버튼 그리드가 같이 늘어나 보이지 않게 한다.
 */
export function GiftSection({ initialTheme, initialData }: GiftSectionProps) {
  const [theme, setTheme] = useState<GiftThemeId>(initialTheme);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isActive = true;
    // ProductListPage와 동일한 목업 워커 기동 대기. 실패해도(로컬 목업 모드 한정) 조회
    // 자체는 시도하게 둔다 — 홈은 비핵심 마케팅 화면이라 별도 에러 경계를 두지 않는다.
    startMockWorker().finally(() => {
      if (isActive) setIsReady(true);
    });
    return () => {
      isActive = false;
    };
  }, []);

  const isInitialTheme = theme === initialTheme;
  const products = useProductList(
    { giftTheme: theme, size: SUGGESTION_SIZE },
    isReady,
    isInitialTheme ? initialData : undefined,
  );

  return (
    <section aria-label="선물" className="bg-subtle">
      <div className="mx-auto w-full max-w-desktop px-4 py-13 sm:px-8 lg:px-12">
        <SectionHeader
          title="선물"
          description="받는 분과 상황을 고르면 크기·관리 난이도·포장 가능 여부까지 맞춰 추려 드립니다"
          viewAll={{
            href: { pathname: "/products", query: { preset: "gift" } },
          }}
        />
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div
            role="tablist"
            aria-label="선물 테마"
            className="grid shrink-0 grid-cols-2 self-start sm:grid-cols-4 lg:w-72.5 lg:grid-cols-2 lg:grid-rows-4"
          >
            {GIFT_THEMES.map((option) => (
              <Button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={option.id === theme}
                onClick={() => setTheme(option.id)}
                variant={option.id === theme ? "solid" : "ghost"}
                size="s"
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            {/* data가 있으면(초기 테마의 initialData 포함) pending·error보다 우선
                보여준다 — 테마를 바꿨다가 재조회가 실패해도 직전 결과가 갑자기 사라지지
                않게 한다. */}
            {products.data?.items.length ? (
              products.data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : products.isPending ? (
              Array.from({ length: SUGGESTION_SIZE }, (_, index) => (
                <Skeleton key={index} className="aspect-square w-full" />
              ))
            ) : products.isError ? (
              <p
                role="status"
                className="col-span-3 text-body-m text-font-dark-secondary"
              >
                추천 상품을 불러오지 못했어요.
              </p>
            ) : (
              <p
                role="status"
                className="col-span-3 text-body-m text-font-dark-secondary"
              >
                이 테마에 맞는 상품이 아직 없어요.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
