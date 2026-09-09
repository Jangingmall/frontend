"use client";

import { Switch } from "@base-ui/react/switch";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / toggle` set. size m(44x24) / s(36x18), 트랙 pill, 안쪽 여백 2.
 *   - 트랙: active `--fill-jade`(#C8D9DC) / inactive `--fill-neutral-weak`(#ECEDEE)
 *   - thumb: 흰 원 + 1px `--border-jade-weak` 테두리. m 20 / s 14
 *   - 이동 거리 = 트랙폭 − 여백2*2 − thumb (m 20 / s 18)
 * Figma disabled variant 는 없어 opacity 로 임의 처리(디자이너 확인 필요).
 */
const toggleVariants = cva(
  "inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors bg-fill-neutral-weak outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill data-checked:bg-fill-jade data-disabled:cursor-not-allowed data-disabled:opacity-40",
  {
    variants: {
      size: {
        s: "h-4.5 w-9",
        m: "h-6 w-11",
      },
    },
    defaultVariants: { size: "m" },
  },
);

const thumbVariants = cva(
  "block rounded-full border border-border-jade-weak bg-bg-default transition-transform",
  {
    variants: {
      size: {
        s: "size-3.5 data-checked:translate-x-4.5",
        m: "size-5 data-checked:translate-x-5",
      },
    },
    defaultVariants: { size: "m" },
  },
);

interface ToggleProps
  extends
    Omit<Switch.Root.Props, "className" | "render">,
    VariantProps<typeof toggleVariants> {
  className?: string;
}

function Toggle({ size = "m", className, ...props }: ToggleProps) {
  return (
    <Switch.Root
      data-slot="toggle"
      className={cn(toggleVariants({ size }), className)}
      {...props}
    >
      <Switch.Thumb className={cn(thumbVariants({ size }))} />
    </Switch.Root>
  );
}

export { Toggle, toggleVariants };
export type { ToggleProps };
