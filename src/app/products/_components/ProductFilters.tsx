"use client";

import type { ProductFilterPanelProps } from "./ProductFilterPanel";
import { ProductFilterPanel } from "./ProductFilterPanel";

type ProductFiltersProps = Omit<
  ProductFilterPanelProps,
  "density" | "defaultOpen" | "accordionClassName" | "onReset"
> & { onReset: () => void };

/** 데스크톱(lg 이상) 좌측 사이드바 필터. 변경을 즉시 반영한다. */
export function ProductFilters(props: ProductFiltersProps) {
  return (
    <aside
      aria-label="상품 필터"
      className="w-full lg:w-41 lg:shrink-0 xl:w-44.25 2xl:w-51"
    >
      <ProductFilterPanel {...props} />
    </aside>
  );
}
