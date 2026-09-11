"use client";

import { useState } from "react";

import { Slider } from "@/components/ui/slider";

interface ProductPriceFilterProps {
  min: number;
  max: number;
  minPrice?: number;
  maxPrice?: number;
  onChange: (range: { minPrice?: number; maxPrice?: number }) => void;
}

export function ProductPriceFilter({
  min,
  max,
  minPrice,
  maxPrice,
  onChange,
}: ProductPriceFilterProps) {
  const lower = Math.max(min, Math.min(max, minPrice ?? min));
  const upper = Math.max(lower, Math.min(max, maxPrice ?? max));
  const [value, setValue] = useState<[number, number]>([lower, upper]);
  return (
    <Slider
      size="s"
      min={min}
      max={max}
      step={1000}
      disabled={min === max}
      value={value}
      minLabel={`${value[0].toLocaleString("ko-KR")}원`}
      maxLabel={`${value[1].toLocaleString("ko-KR")}원`}
      getAriaLabel={(index) => (index === 0 ? "최소 가격" : "최대 가격")}
      onValueChange={(next) => {
        if (Array.isArray(next)) setValue([next[0], next[1]]);
      }}
      onValueCommitted={(next) => {
        if (Array.isArray(next))
          onChange({
            minPrice: next[0] === min ? undefined : next[0],
            maxPrice: next[1] === max ? undefined : next[1],
          });
      }}
    />
  );
}
