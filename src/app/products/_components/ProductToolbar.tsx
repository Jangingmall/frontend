"use client";

import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Select, SelectItem } from "@/components/ui/select";
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
  { value: "newest", label: "신상품순" },
  { value: "wishlist", label: "찜 많은순" },
  { value: "sales", label: "판매량순" },
  { value: "price-asc", label: "낮은 가격순" },
  { value: "price-desc", label: "높은 가격순" },
];

export function ProductToolbar({
  category,
  parent,
  sort,
  onSortChange,
}: ProductToolbarProps) {
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem href="/">홈</BreadcrumbItem>
        {parent && (
          <BreadcrumbItem
            href={`/products?category=${encodeURIComponent(parent.id)}`}
          >
            {parent.name}
          </BreadcrumbItem>
        )}
        <BreadcrumbItem current>{category?.name ?? "전체 상품"}</BreadcrumbItem>
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
          items={SORT_OPTIONS}
          onValueChange={(value) => {
            if (value) onSortChange(value as ProductListSort);
          }}
          className="w-25"
        >
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
}
