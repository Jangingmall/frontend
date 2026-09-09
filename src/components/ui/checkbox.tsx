"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / checkbox` set. Size s(16) / m(24), radius 0.
 * - unchecked: 투명 + 테두리 `--border-jade-weak`(jade-blue-500 50%), 두께 s 1.5 / m 2
 * - checked: `--fill-neutral-impact`(#121B29) 배경 + 흰 체크, 테두리 없음
 * - 라벨: gap 8, 색 `--font-dark-subtle`. 타이포 s `text-body-m`(14/400) / m `text-button-xl`(16/500)
 * Figma 에 disabled 상태는 없어 opacity 로 임의 처리(디자이너 확인 필요).
 */
const checkboxVariants = cva(
  "flex shrink-0 items-center justify-center border border-border-jade-weak text-font-white transition-colors data-checked:border-transparent data-checked:bg-fill-neutral-impact data-disabled:cursor-not-allowed data-disabled:opacity-60",
  {
    variants: {
      size: {
        s: "size-4 border-[1.5px] [&_svg]:size-2.5",
        m: "size-6 border-2 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { size: "s" },
  },
);

const LABEL_TEXT = { s: "text-body-m", m: "text-button-xl" } as const;

interface CheckboxProps
  extends
    Omit<CheckboxPrimitive.Root.Props, "className" | "render">,
    VariantProps<typeof checkboxVariants> {
  className?: string;
  /** 있으면 박스 오른쪽에 라벨을 두고 전체를 `<label>` 로 감싼다 */
  children?: ReactNode;
}

function Checkbox({
  size = "s",
  className,
  children,
  disabled,
  ...props
}: CheckboxProps) {
  const control = (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      disabled={disabled}
      className={cn(checkboxVariants({ size }), !children && className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <CheckMark />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!children) return control;

  return (
    <label
      className={cn(
        // align-middle: inline-flex 의 세로 위치가 첫 자식(체크박스) baseline 을 따라가
        // checked 시 내부 SVG 때문에 label 이 밀리는 것을 막는다.
        "inline-flex items-center gap-2 align-middle",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      {control}
      <span className={cn(LABEL_TEXT[size ?? "s"], "text-font-dark-subtle")}>
        {children}
      </span>
    </label>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 14 10" fill="none" aria-hidden="true">
      <path
        d="M2 5.4 5.4 8.8 12 1.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { Checkbox, checkboxVariants };
export type { CheckboxProps };
