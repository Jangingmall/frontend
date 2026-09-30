"use client";

import { canUseProductCrafts } from "@/api/products/integration";
import type { ProductListQuery } from "@/api/products/query";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";
import type {
  ProductCategory,
  ProductCraft,
  ProductMaterial,
} from "@/types/product-filter";

import { ProductCraftFilter } from "./ProductCraftFilter";
import { ProductPriceFilter } from "./ProductPriceFilter";

export interface ProductFilterPanelProps {
  query: ProductListQuery;
  category: ProductCategory;
  categories: ProductCategory[];
  materials: ProductMaterial[];
  crafts: ProductCraft[];
  isCraftsPending?: boolean;
  hasCraftsError?: boolean;
  onRetryCrafts?: () => void;
  onChange: (patch: Partial<ProductListQuery>) => void;
  /** 주면 상단에 "필터 / 초기화" 헤더를 그린다(사이드바). 시트는 자체 헤더·하단 버튼을 쓴다. */
  onReset?: () => void;
  /** 종목·소재 칩 높이: `compact` 28(사이드바) / `comfortable` 36(시트 시안) */
  density?: "compact" | "comfortable";
  /** 처음 펼쳐 둘 항목(`craft`·`category`·`price`·`material`). 기본은 사이드바 규칙 */
  defaultOpen?: string[];
  /** 아코디언 루트에 덧붙이는 클래스(시트 md 3열 배치 등) */
  accordionClassName?: string;
}

/**
 * 상품 목록 필터 본문(분류·종목·가격·소재·선물 포장). 데스크톱 사이드바와 md 이하 필터 시트가
 * 함께 쓴다 — 어느 쪽이든 `query`를 보여 주고 변경을 `onChange` 패치로 알리는 제어형이다.
 */
export function ProductFilterPanel({
  query,
  category,
  categories,
  materials,
  crafts,
  isCraftsPending,
  hasCraftsError,
  onRetryCrafts,
  onChange,
  onReset,
  density = "compact",
  defaultOpen,
  accordionClassName,
}: ProductFilterPanelProps) {
  const parent =
    categories.find((item) => item.id === category.parentId) ?? category;
  const children = categories.filter((item) => item.parentId === parent.id);
  const isSubcategory = category.parentId !== null;
  const isComfortable = density === "comfortable";

  function handleMaterial(id: string) {
    const selected = query.materials ?? [];
    onChange({
      materials: selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    });
  }

  return (
    <>
      <Accordion
        key={category.id}
        title={onReset ? "필터" : undefined}
        onReset={onReset}
        multiple
        defaultValue={
          defaultOpen ??
          (canUseProductCrafts() && isSubcategory && query.crafts?.length
            ? ["craft", "price", "material"]
            : ["category", "price", "material"])
        }
        className={cn(
          "[&_[data-slot=accordion-item]]:border-b [&_[data-slot=accordion-item]]:border-border-neutral-weak [&_[data-slot=accordion]]:space-y-1 [&_[data-slot=accordion]]:pt-1",
          // 상단 "필터 / 초기화" 헤더가 있을 때만 그 헤더 스타일을 준다.
          onReset &&
            "[&>div:first-child]:py-2 [&>div:first-child]:pl-2 [&>div:first-child>button]:underline",
          accordionClassName,
        )}
      >
        {isSubcategory && canUseProductCrafts() && (
          <AccordionItem title={category.name} value="craft">
            <ProductCraftFilter
              crafts={crafts}
              selected={query.crafts ?? []}
              isPending={isCraftsPending}
              hasError={hasCraftsError}
              onRetry={onRetryCrafts}
              density={density}
              onChange={(crafts) => onChange({ crafts })}
            />
          </AccordionItem>
        )}
        {(!isSubcategory || !canUseProductCrafts()) && (
          <AccordionItem title={parent.name} value="category">
            <nav aria-label="상품 분류" className="-mx-2 flex flex-col">
              {children.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={query.category === item.id ? "page" : undefined}
                  onClick={() =>
                    onChange({
                      category: item.id,
                      materials: [],
                      minPrice: undefined,
                      maxPrice: undefined,
                    })
                  }
                  className="border-b border-border-neutral-subtle px-2 py-2 text-left text-body-m text-font-dark last:border-b-0 aria-[current=page]:font-bold"
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </AccordionItem>
        )}
        <AccordionItem title="가격대" value="price">
          <div className="-mx-1 pt-2 pb-1">
            <ProductPriceFilter
              key={category.id}
              min={category.minPrice}
              max={category.maxPrice}
              minPrice={query.minPrice}
              maxPrice={query.maxPrice}
              onChange={onChange}
            />
          </div>
        </AccordionItem>
        {publicEnv.apiMocking && (
          <AccordionItem title="소재" value="material">
            <div
              className={cn(
                "grid grid-cols-2",
                isComfortable ? "gap-x-2 gap-y-1" : "gap-1",
              )}
            >
              {materials.map((material) => {
                const isSelected =
                  query.materials?.includes(material.id) ?? false;
                return (
                  <Button
                    key={material.id}
                    type="button"
                    variant="outline"
                    className={cn(
                      "min-w-0 text-body-m aria-pressed:border-border-jade-fill aria-pressed:bg-states-hover",
                      isComfortable ? "h-9" : "h-7",
                    )}
                    size="xs"
                    aria-pressed={isSelected}
                    onClick={() => handleMaterial(material.id)}
                  >
                    {material.name}
                  </Button>
                );
              })}
            </div>
          </AccordionItem>
        )}
      </Accordion>
      {publicEnv.apiMocking && (
        <div className="flex min-h-9 items-center px-2">
          <Checkbox
            checked={query.hasGiftWrap ?? false}
            onCheckedChange={(checked) => onChange({ hasGiftWrap: checked })}
          >
            선물 포장 가능
          </Checkbox>
        </div>
      )}
    </>
  );
}
