"use client";

import { NumberField } from "@base-ui/react/number-field";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { MinusIcon, PlusIcon } from "./icons";

/**
 * Figma `[FE] Components / stepper` set 은 +/− 버튼 하나만 정의한다(Size m 36 / s 24,
 * radius 2, 배경 `--fill-jade-weak`, 테두리 `--border-neutral-subtle`, 아이콘 `#121B29`).
 * 실사용 컴포넌트는 `[−][값][+]` 수량 컨트롤이라 `@base-ui/react/number-field` 로 조합한다 —
 * 가운데 값 표시 스타일은 Figma 미정의라 `text-body-m` 로 임의 지정.
 * Figma disabled variant 는 padding 만 살짝 다를 뿐이라 opacity 로 처리.
 */
const stepperButtonVariants = cva(
  "flex shrink-0 items-center justify-center rounded-xs border border-border-neutral-subtle bg-fill-jade-weak text-font-dark transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      size: {
        s: "size-6 [&_svg]:size-4",
        m: "size-9 [&_svg]:size-6",
      },
    },
    defaultVariants: { size: "m" },
  },
);

interface StepperProps
  extends
    Omit<NumberField.Root.Props, "className" | "render">,
    VariantProps<typeof stepperButtonVariants> {
  className?: string;
}

function Stepper({ size = "m", className, disabled, ...props }: StepperProps) {
  return (
    <NumberField.Root
      data-slot="stepper"
      disabled={disabled}
      className={cn("inline-flex", className)}
      {...props}
    >
      <NumberField.Group className="flex items-center gap-2">
        <NumberField.Decrement
          className={cn(stepperButtonVariants({ size }))}
          aria-label="감소"
        >
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input
          className={cn(
            "bg-transparent text-center text-body-m text-font-dark tabular-nums outline-none disabled:opacity-40",
            size === "s" ? "w-8" : "w-10",
          )}
        />
        <NumberField.Increment
          className={cn(stepperButtonVariants({ size }))}
          aria-label="증가"
        >
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}

export { Stepper, stepperButtonVariants };
export type { StepperProps };
