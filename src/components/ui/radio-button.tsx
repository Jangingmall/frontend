"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / selecter` set 의 `Type=radio` 만 반입. 24px 고정, 라벨·size·disabled
 * variant 없음(Figma 기준). 링·점 색 모두 `--border-jade-fill`(jade-blue-700).
 *   - default: 링만
 *   - selected: 링 + 가운데 점
 * 라벨(children)·disabled 는 실사용 편의로 추가 — 라벨 타이포/색은 Figma 미정의라 `text-body-m` +
 * `--font-dark-subtle` 로 임의 지정(디자이너 확인 필요).
 */
function RadioGroup({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive>) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

interface RadioProps extends Omit<
  RadioPrimitive.Root.Props,
  "className" | "render"
> {
  className?: string;
  /** 있으면 컨트롤 오른쪽에 라벨을 두고 전체를 `<label>` 로 감싼다 */
  children?: ReactNode;
}

function Radio({ className, children, disabled, ...props }: RadioProps) {
  const control = (
    <RadioPrimitive.Root
      data-slot="radio"
      disabled={disabled}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-jade-fill data-disabled:cursor-not-allowed data-disabled:opacity-60",
        !children && className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator className="size-2.5 rounded-full bg-border-jade-fill" />
    </RadioPrimitive.Root>
  );

  if (!children) return control;

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      {control}
      <span className="text-body-m text-font-dark-subtle">{children}</span>
    </label>
  );
}

export { RadioGroup, Radio };
export type { RadioProps };
