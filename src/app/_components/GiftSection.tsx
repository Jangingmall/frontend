"use client";

import { useEffect, useState } from "react";

import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { startMockWorker } from "@/mocks/start-browser";
import { useHomeGifts } from "@/queries/home/queries";
import type { Page } from "@/types/api";
import { GIFT_THEMES, type GiftThemeId } from "@/types/gift-theme";
import type { ProductSummary } from "@/types/product";

import { SectionHeader } from "./SectionHeader";

const SUGGESTION_SIZE = 3;

// 시안: 카드는 브레이크포인트별 고정 폭(mobile 160 / md 242 / lg 260 / xl 이상 318) — 좁으면 행이 가로 스크롤된다.
const GIFT_CARD_CLASS = "w-40 shrink-0 md:w-60.5 lg:w-65 xl:w-79.5";

interface GiftSectionProps {
  initialTheme: GiftThemeId;
  initialData?: Page<ProductSummary>;
}

/** 홈 전용 MSW 추천. 실제 상품 목록과 캐시를 분리하고 테마별로 조회한다. */
export function GiftSection({ initialTheme, initialData }: GiftSectionProps) {
  const [theme, setTheme] = useState<GiftThemeId>(initialTheme);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isActive = true;
    // ProductListPage와 동일한 목업 워커 기동 대기. 실패해도(로컬 목업 모드 한정) 조회
    // 자체는 시도하게 둔다 — 홈은 비핵심 마케팅 화면이라 별도 에러 경계를 두지 않는다.
    // `.catch()`로 먼저 reject를 소비해야 한다 — `finally()`만 쓰면 원래 reject가 그대로
    // 전파돼 unhandled promise rejection이 된다.
    startMockWorker()
      .catch(() => undefined)
      .finally(() => {
        if (isActive) setIsReady(true);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const isInitialTheme = theme === initialTheme;
  const products = useHomeGifts(
    theme,
    isReady,
    isInitialTheme ? initialData : undefined,
  );

  return (
    <section aria-label="선물" className="bg-bg-subtle">
      <div className="mx-auto w-full max-w-desktop page-gutter py-6 md:py-10.5 lg:py-13">
        <SectionHeader
          title="선물"
          description="받는 분과 상황을 고르면 크기·관리 난이도·포장 가능 여부까지 맞춰 추려 드립니다"
          viewAll={{
            href: { pathname: "/products", query: { preset: "gift" } },
          }}
        />
        <div className="mt-6 flex flex-col gap-6 md:flex-row lg:gap-11">
          <div
            role="tablist"
            aria-label="선물 테마"
            className="grid shrink-0 grid-cols-2 gap-1 self-start md:w-40.5 md:grid-cols-1 lg:w-72.5 lg:grid-cols-2 lg:grid-rows-4 lg:gap-0"
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
          <div className="relative flex min-w-0 flex-1 gap-3 overflow-x-auto pb-3 lg:gap-4">
            {/* data가 있으면(초기 테마의 initialData 포함) pending·error보다 우선
                보여준다 — 테마를 바꿨다가 재조회가 실패해도 직전 결과가 갑자기 사라지지
                않게 한다. */}
            {products.data?.items.length ? (
              products.data.items.map((product) => (
                <div key={product.id} className={GIFT_CARD_CLASS}>
                  <ProductCard product={product} />
                </div>
              ))
            ) : products.isPending ? (
              Array.from({ length: SUGGESTION_SIZE }, (_, index) => (
                <Skeleton
                  key={index}
                  className={cn("aspect-square", GIFT_CARD_CLASS)}
                />
              ))
            ) : products.isError ? (
              <p role="status" className="text-body-m text-font-dark-secondary">
                추천 상품을 불러오지 못했어요.
              </p>
            ) : (
              <p role="status" className="text-body-m text-font-dark-secondary">
                이 테마에 맞는 상품이 아직 없어요.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
