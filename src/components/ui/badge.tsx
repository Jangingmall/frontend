import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / Badge` — 3개 set(artisan / products / order-states)이 각각 하나의
 * 스타일을 쓴다(라벨별 색 차이는 없음). 그래서 라벨→색 상수맵 없이 `variant` 하나로 처리:
 *   - `jade`  (badge-artisan): `--badge-jade`(#C8D9DC) 배경 + `text-caption`(10/400) 다크
 *   - `solid` (badge-products): `--fill-neutral-impact`(#121B29) 배경 + `text-caption-b`(10/600) 흰색
 *   - `plain` (badge-order-states): 배경 없음 + `text-body-m` 볼드(14/700) 다크 — 상태 라벨용
 * radius 0. `--badge-red` / `--badge-yellow` 토큰도 있으나 대응 Figma variant 가 없어 미구현.
 */
const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap",
  {
    variants: {
      variant: {
        jade: "bg-(--badge-jade) px-2 py-1 text-caption text-font-dark",
        solid:
          "bg-fill-neutral-impact px-2 py-1 text-caption-b text-font-white",
        plain: "px-3 py-1 text-body-m font-bold text-font-dark",
      },
    },
    defaultVariants: { variant: "jade" },
  },
);

interface BadgeProps
  extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

function Badge({ variant, className, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
