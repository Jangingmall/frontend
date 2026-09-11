"use client";

import type { ProductListQuery } from "@/api/products/query";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProductCategory, ProductMaterial } from "@/types/product-filter";

import { ProductPriceFilter } from "./ProductPriceFilter";

interface ProductFiltersProps {
  query: ProductListQuery;
  category: ProductCategory;
  categories: ProductCategory[];
  materials: ProductMaterial[];
  onChange: (patch: Partial<ProductListQuery>) => void;
  onReset: () => void;
}

export function ProductFilters({
  query,
  category,
  categories,
  materials,
  onChange,
  onReset,
}: ProductFiltersProps) {
  const parent =
    categories.find((item) => item.id === category.parentId) ?? category;
  const children = categories.filter((item) => item.parentId === parent.id);

  function handleMaterial(id: string) {
    const selected = query.materials ?? [];
    onChange({
      materials: selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    });
  }

  return (
    <aside aria-label="상품 필터" className="w-full lg:w-51 lg:shrink-0">
      <Accordion
        title="필터"
        onReset={onReset}
        multiple
        className="[&>div:first-child]:px-2 [&>div:first-child]:pt-2 [&>div:first-child>button]:underline"
      >
        <AccordionItem title={parent.name} value="category">
          <nav aria-label="상품 분류" className="flex flex-col">
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
                className="border-b border-border-neutral-subtle py-2 text-left text-body-m text-font-dark aria-[current=page]:font-bold"
              >
                {item.name}
              </button>
            ))}
          </nav>
        </AccordionItem>
        <AccordionItem title="가격대" value="price">
          <ProductPriceFilter
            key={category.id}
            min={category.minPrice}
            max={category.maxPrice}
            minPrice={query.minPrice}
            maxPrice={query.maxPrice}
            onChange={onChange}
          />
        </AccordionItem>
        <AccordionItem title="소재" value="material">
          <div className="grid grid-cols-2 gap-1">
            {materials.map((material) => {
              const isSelected =
                query.materials?.includes(material.id) ?? false;
              return (
                <Button
                  key={material.id}
                  type="button"
                  variant={isSelected ? "solid" : "outline"}
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
      </Accordion>
      <div className="flex min-h-9 items-center px-2">
        <Checkbox
          checked={query.hasGiftWrap ?? false}
          onCheckedChange={(checked) => onChange({ hasGiftWrap: checked })}
        >
          선물 포장 가능
        </Checkbox>
      </div>
    </aside>
  );
}
