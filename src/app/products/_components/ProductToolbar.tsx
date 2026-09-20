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
  const options = SORT_OPTIONS.map((option) => ({
    ...option,
    disabled:
      !publicEnv.apiMocking && ["sales", "wishlist"].includes(option.value),
  }));
  return (
    <div>
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
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-title-xl text-font-dark">
            {category?.name ?? "전체 상품"}
          </h1>
          {category?.description && (
            <p className="mt-2 text-body-l font-medium text-font-dark-weak">
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
          className="w-32 shrink-0 whitespace-nowrap"
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
