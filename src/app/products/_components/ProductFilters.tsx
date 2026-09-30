"use client";

import { PRODUCT_FILTER_WIDTH_CLASS } from "@/app/products/_lib/product-list-layout";
import { cn } from "@/lib/utils";

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
      className={cn("hidden w-full lg:block", PRODUCT_FILTER_WIDTH_CLASS)}
    >
      <ProductFilterPanel {...props} />
    </aside>
  );
}
