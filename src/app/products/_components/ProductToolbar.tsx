"use client";

import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import type { ProductCategory } from "@/types/product-filter";
import type { ProductListSort } from "@/types/sort";

interface ProductToolbarProps {
  category?: ProductCategory;
  parent?: ProductCategory;
  sort: ProductListSort;
  onSortChange: (sort: ProductListSort) => void;
  /** 있으면 `lg` 미만에서 [필터] 버튼을 보이고, 누르면 호출한다(필터 시트 열기). */
  onFilterOpen?: () => void;
}

const SORT_OPTIONS: { value: ProductListSort; label: string }[] = [
  { value: "popular", label: "인기순" },
  { value: "newest", label: "최신순" },
  { value: "sales", label: "판매량순" },
  { value: "wishlist", label: "찜 많은 순" },
  { value: "price-asc", label: "낮은 가격순" },
  { value: "price-desc", label: "높은 가격순" },
];

export function ProductToolbar({
  category,
  parent,
  sort,
  onSortChange,
  onFilterOpen,
}: ProductToolbarProps) {
  const rootCategory = parent ?? category;
  const options = SORT_OPTIONS.map((option) => ({
    ...option,
    disabled: false,
  }));
  return (
    <div>
      {/* 모바일 시안에는 경로 표시가 없다. nav째로 숨겨 빈 landmark가 남지 않게 한다. */}
      <div className="hidden md:block">
        <Breadcrumb className="flex-wrap">
          <BreadcrumbItem href={category ? "/products" : "/"}>
            {category ? "전체 카테고리" : "홈"}
          </BreadcrumbItem>
          {rootCategory && (
            <BreadcrumbItem
              href={`/products?category=${encodeURIComponent(rootCategory.id)}`}
            >
              {rootCategory.name}
            </BreadcrumbItem>
          )}
          <BreadcrumbItem current>
            {parent ? category?.name : "전체 상품"}
          </BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div className="flex items-end justify-between gap-2 md:mt-6 md:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-title-l text-font-dark md:text-title-xl">
            {category?.name ?? "전체 상품"}
          </h1>
          {category?.description && (
            <p className="mt-2 truncate text-body-m font-medium text-font-dark-weak lg:text-body-l">
              {category.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            ariaLabel="상품 정렬"
            value={sort}
            items={options}
            onValueChange={(value) => {
              if (value) onSortChange(value as ProductListSort);
            }}
            className="h-7 w-auto min-w-18 shrink-0 whitespace-nowrap md:h-9 md:min-w-25 lg:w-32"
            contentClassName="whitespace-nowrap"
            alignItemWithTrigger={false}
          >
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                title={option.disabled ? "준비 중인 정렬입니다" : undefined}
              >
                {option.label}
              </SelectItem>
            ))}
          </Select>
          {onFilterOpen && (
            <Button
              type="button"
              size="xs"
              aria-haspopup="dialog"
              className="shrink-0 md:h-9 md:px-6 lg:hidden"
              onClick={onFilterOpen}
            >
              필터
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
