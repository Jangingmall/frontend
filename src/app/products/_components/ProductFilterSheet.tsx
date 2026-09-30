"use client";

import { useState } from "react";

import type { ProductListQuery } from "@/api/products/query";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

import type { ProductFilterPanelProps } from "./ProductFilterPanel";
import { ProductFilterPanel } from "./ProductFilterPanel";

/** 시트에서 편집하는 필터. 품절 제외·정렬·검색어는 시트 밖 조건이라 초안에 넣지 않는다. */
type FilterDraft = Pick<
  ProductListQuery,
  "category" | "crafts" | "materials" | "minPrice" | "maxPrice" | "hasGiftWrap"
>;

function toDraft(query: ProductListQuery): FilterDraft {
  return {
    category: query.category,
    crafts: query.crafts ?? [],
    materials: query.materials ?? [],
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    hasGiftWrap: query.hasGiftWrap ?? false,
  };
}

// md(768~1023) 시안: 항목 헤더 3개가 한 줄, 펼친 패널이 아래 전폭. Accordion API를 바꾸지 않고
// 항목·헤더를 `display: contents`로 풀어 트리거(order-1)와 패널(order-2, 전폭)을 한 그리드에 둔다.
// ⚠ Base UI Accordion 마크업에 의존한다: 헤더가 항목의 직계 `h3`, 패널이 직계 `div`라는 전제.
// 구조가 바뀌면 배치가 조용히 깨지므로 E2E(`products.spec.ts`의 md 필터 시트 테스트)가 세 트리거의
// 위치·전폭 패널·키보드·헤딩 의미를 지킨다. Accordion을 업그레이드하거나 바꾸면 그 테스트를 먼저 본다.
const MD_THREE_COLUMN =
  "md:[&_[data-slot=accordion-item]]:contents md:[&_[data-slot=accordion-item]>h3]:contents md:[&_[data-slot=accordion-item]_button]:order-1 md:[&_[data-slot=accordion-item]>div]:order-2 md:[&_[data-slot=accordion-item]>div]:col-span-3 md:[&_[data-slot=accordion]]:grid md:[&_[data-slot=accordion]]:grid-cols-3 md:[&_[data-slot=accordion]]:items-start md:[&_[data-slot=accordion]]:gap-x-2";

interface ProductFilterSheetProps extends Omit<
  ProductFilterPanelProps,
  "density" | "defaultOpen" | "accordionClassName" | "onReset" | "onChange"
> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 확인: 초안 전체를 한 번의 변경으로 넘긴다(호출부가 URL을 갱신하고 시트를 닫는다). */
  onApply: (patch: Partial<ProductListQuery>) => void;
}

/**
 * md 이하(lg 미만)의 필터 시트. 열 때 현재 URL 필터를 초안으로 복사해 편집하고, [확인]에서만
 * 반영한다. [초기화]는 초안만 비우고(분류는 유지), 닫기·ESC·바깥 클릭은 초안을 버린다.
 */
export function ProductFilterSheet({
  open,
  onOpenChange,
  onApply,
  query,
  category,
  categories,
  ...panelProps
}: ProductFilterSheetProps) {
  const [draft, setDraft] = useState<FilterDraft>(() => toDraft(query));
  const [wasOpen, setWasOpen] = useState(open);
  // 열리는 순간의 URL 필터로 초안을 다시 만든다(렌더 중 파생 상태 갱신 — effect 불필요).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(toDraft(query));
  }

  const draftCategory =
    categories.find((item) => item.id === draft.category) ?? category;

  function handleReset() {
    setDraft((current) => ({
      category: current.category,
      crafts: [],
      materials: [],
      minPrice: undefined,
      maxPrice: undefined,
      hasGiftWrap: false,
    }));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="필터"
      variant="sheet"
      footer={
        <div className="flex gap-3 md:gap-2">
          <Button
            type="button"
            variant="outline"
            size="s"
            className="h-12 flex-1 md:w-65 md:flex-none"
            onClick={handleReset}
          >
            초기화
          </Button>
          <Button
            type="button"
            size="s"
            className="h-12 flex-1"
            onClick={() => onApply(draft)}
          >
            확인
          </Button>
        </div>
      }
    >
      <ProductFilterPanel
        {...panelProps}
        query={{ ...query, ...draft }}
        category={draftCategory}
        categories={categories}
        density="comfortable"
        defaultOpen={draft.crafts?.length ? ["craft"] : []}
        accordionClassName={MD_THREE_COLUMN}
        onChange={(patch) =>
          setDraft((current) => ({
            ...current,
            ...patch,
            // 분류가 바뀌면 종목을 해제한다(사이드바·URL 갱신 규칙과 같다). 초안 전체를 넘기는
            // [확인]이 분류 변경 때 지워진 `subcategory`를 되살리지 않게 한다.
            ...(patch.category !== undefined &&
              patch.category !== current.category && { crafts: [] }),
          }))
        }
      />
    </Dialog>
  );
}
