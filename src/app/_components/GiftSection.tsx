"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { startMockWorker } from "@/mocks/start-browser";
import { useProductList } from "@/queries/products/queries";
import type { Page } from "@/types/api";
import { GIFT_THEMES, type GiftThemeId } from "@/types/gift-theme";
import type { ProductSummary } from "@/types/product";

const SUGGESTION_SIZE = 3;

interface GiftSectionProps {
  initialTheme: GiftThemeId;
  initialData?: Page<ProductSummary>;
}

/**
 * 홈 "선물" 섹션(design.md §0.2 "선물") — 테마 토글 8개(단일 선택) + 선택에 반응하는
 * 상품 추천 3개. 초기 설계는 이 8개를 "이미지 타일→링크"로 가정했는데 Figma 확인 결과
 * 틀렸다 — 실제로는 이 컴포넌트처럼 클라이언트에서 실시간으로 카드가 바뀌는 섹션이다.
 *
 * 최초 테마 결과는 `page.tsx`가 서버에서 미리 조회해 `initialData`로 넘겨 첫 페인트를
 * 채운다(`ProductListPage`와 같은 서버 fetch → client `initialData` 패턴).
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
    <section
      aria-label="선물"
      className="mx-auto w-full max-w-desktop px-4 py-12 sm:px-8 lg:px-12"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-title-l">선물</h2>
          <p className="mt-1 text-body-m text-font-dark-subtle">
            받는 분과 상황을 고르면 크기·관리 난이도·포장 가능 여부까지 맞춰
            추려 드립니다
          </p>
        </div>
        <Link
          href={{ pathname: "/products", query: { preset: "gift" } }}
          className="shrink-0 text-body-s text-font-dark underline underline-offset-2"
        >
          전체보기
        </Link>
      </div>
      <div
        role="tablist"
        aria-label="선물 테마"
        className="mb-6 flex flex-wrap gap-2"
      >
        {GIFT_THEMES.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={option.id === theme}
            onClick={() => setTheme(option.id)}
            className={cn(
              "rounded-xs border px-4 py-2 text-body-s transition-colors",
              option.id === theme
                ? "border-fill-neutral-impact bg-fill-neutral-impact text-font-white"
                : "border-border-neutral-subtle text-font-dark hover:bg-states-hover",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-x-6 gap-y-6">
        {/* data가 있으면(초기 테마의 initialData 포함) pending·error보다 우선 보여준다 —
            테마를 바꿨다가 재조회가 실패해도 직전 결과가 갑자기 사라지지 않게 한다. */}
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
            className="col-span-3 text-body-m text-font-dark-subtle"
          >
            추천 상품을 불러오지 못했어요.
          </p>
        ) : (
          <p
            role="status"
            className="col-span-3 text-body-m text-font-dark-subtle"
          >
            이 테마에 맞는 상품이 아직 없어요.
          </p>
        )}
      </div>
    </section>
  );
}
