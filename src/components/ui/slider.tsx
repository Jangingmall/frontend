"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / slider_price` set. size m(thumb 28) / s(thumb 16).
 * Figma 의 `s-price` / `s-default` 는 아래 라벨 텍스트만 다를 뿐 구조가 같아 `s` 하나로 합쳤다.
 *   - 트랙: 4px pill, `--border-jade-weak`
 *   - 채워진 구간: `--fill-neutral-impact`(#121B29)
 *   - thumb: 흰 원 + `shadow-floating`(그림자는 Figma 노드엔 없지만 시안상 존재 — 임의 반영)
 *   - 아래 min/max 라벨(옵션): `text-caption`(10px) `--font-dark-subtle`
 * `value`/`defaultValue` 가 배열이면 range(thumb 2개).
 */
const sliderThumbVariants = cva(
  "rounded-full bg-bg-default shadow-floating outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill",
  {
    variants: { size: { s: "size-4", m: "size-7" } },
    defaultVariants: { size: "m" },
  },
);

interface SliderProps
  extends
    Omit<SliderPrimitive.Root.Props, "className" | "render">,
    VariantProps<typeof sliderThumbVariants> {
  className?: string;
  minLabel?: ReactNode;
  maxLabel?: ReactNode;
}

function Slider({
  size = "m",
  className,
  minLabel,
  maxLabel,
  value,
  defaultValue,
  ...props
}: SliderProps) {
  const isRange = Array.isArray(value ?? defaultValue);

  return (
    <SliderPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      data-slot="slider"
      className={cn(
        "flex w-full flex-col",
        size === "s" ? "gap-1" : "gap-2",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Control
        className={cn(
          "flex w-full touch-none items-center px-3 select-none",
          size === "s" ? "h-5" : "h-7",
        )}
      >
        <SliderPrimitive.Track className="relative h-1 w-full rounded-full bg-border-jade-weak">
          <SliderPrimitive.Indicator className="rounded-full bg-fill-neutral-impact" />
          {isRange ? (
            <>
              <SliderPrimitive.Thumb
                index={0}
                className={cn(sliderThumbVariants({ size }))}
              />
              <SliderPrimitive.Thumb
                index={1}
                className={cn(sliderThumbVariants({ size }))}
              />
            </>
          ) : (
            <SliderPrimitive.Thumb
              className={cn(sliderThumbVariants({ size }))}
            />
          )}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>

      {(minLabel != null || maxLabel != null) && (
        <div className="flex items-center justify-between px-3">
          <span className="text-caption text-font-dark-subtle">{minLabel}</span>
          <span className="text-caption text-font-dark-subtle">{maxLabel}</span>
        </div>
      )}
    </SliderPrimitive.Root>
  );
}

export { Slider, sliderThumbVariants };
export type { SliderProps };
