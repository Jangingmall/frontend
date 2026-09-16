"use client";

import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ProductCraft } from "@/types/product-filter";

interface ProductCraftFilterProps {
  crafts: ProductCraft[];
  selected: string[];
  isPending?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  onChange: (crafts: string[]) => void;
}

export function ProductCraftFilter({
  crafts,
  selected,
  isPending,
  hasError,
  onRetry,
  onChange,
}: ProductCraftFilterProps) {
  if (hasError) {
    return (
      <ErrorState
        title="종목을 불러오지 못했어요"
        className="px-0 py-3"
        onRetry={onRetry}
      />
    );
  }
  if (isPending) {
    return (
      <div role="status">
        <span className="sr-only">종목을 불러오는 중</span>
        <Skeleton className="h-23 w-full" />
      </div>
    );
  }
  if (!crafts.length) {
    return <p className="py-2 text-body-m">선택할 수 있는 종목이 없어요.</p>;
  }
  return (
    <div role="group" aria-label="종목" className="grid grid-cols-2 gap-1">
      {crafts.map((craft) => {
        const isSelected = selected.includes(craft.id);
        return (
          <Button
            key={craft.id}
            type="button"
            variant="outline"
            size="xs"
            aria-pressed={isSelected}
            className={cn(
              "min-w-0",
              isSelected
                ? "border-border-jade-fill before:bg-states-hover"
                : "border-border-neutral-subtle",
            )}
            onClick={() =>
              onChange(
                isSelected
                  ? selected.filter((id) => id !== craft.id)
                  : [...selected, craft.id],
              )
            }
          >
            <span className="truncate" title={craft.name}>
              {craft.name}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
