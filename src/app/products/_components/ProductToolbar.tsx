"use client";

import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Select, SelectItem } from "@/components/ui/select";
import { publicEnv } from "@/lib/env";
import type { ProductCategory } from "@/types/product-filter";
import type { ProductListSort } from "@/types/sort";

interface ProductToolbarProps {
  category?: ProductCategory;
  parent?: ProductCategory;
  sort: ProductListSort;
  onSortChange: (sort: ProductListSort) => void;
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
}: ProductToolbarProps) {
  const rootCategory = parent ?? category;
  const options = SORT_OPTIONS.filter(
    (option) =>
      publicEnv.apiMocking ||
      ["newest", "price-asc", "price-desc"].includes(option.value),
  ).map((option) => ({
    ...option,
    // BE의 POPULAR는 아직 ID 내림차순이므로 실제 인기순 지원으로 취급하지 않는다.
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
      </div>
    </div>
  );
}
