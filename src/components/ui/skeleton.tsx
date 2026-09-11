import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * 데이터 로딩 중 placeholder. (docs/ui-system.md §7.2)
 *
 * shadcn `skeleton`을 토큰에 맞춰 이식했다. `--bg-skeleton`은 Figma 그룹명을 그대로 옮긴
 * semantic 토큰이라 색은 근거가 있고(→ `globals.css`), 모션은 이 프로젝트가 이미 쓰는
 * `animate-pulse`(`Button`의 `LoadingDots`)를 따른다.
 *
 * variant 없는 프리미티브다. 화면별 로딩 레이아웃(상품 카드/상세/장바구니 항목)은 각 화면이
 * 이 컴포넌트를 여러 개 조합해 만든다.
 */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-xs bg-bg-skeleton", className)}
      {...props}
    />
  );
}

export { Skeleton };
