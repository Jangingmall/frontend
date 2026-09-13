import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * 실제 이미지 자산이 없는 자리를 표시하는 체크보드 패턴(투명도 표시에 흔히 쓰는 바로 그
 * 패턴). 평범한 단색 블록(`bg-skeleton`)보다 "여긴 자산 대기 중"이라는 신호가 훨씬
 * 분명해서, 자산이 없는 히어로 배경·장인관 이미지에 쓴다(design.md §4-4 결정 — 플레이스홀더
 * 티가 나게 둔다). `bg-skeleton`(Tailwind 유틸리티만으로 표현 불가한 다중 그라디언트라
 * 인라인 style로 그린다.
 */
export function ImagePlaceholder({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-skeleton", className)}
      style={{
        backgroundImage: [
          "linear-gradient(45deg, rgba(255,255,255,0.5) 25%, transparent 25%)",
          "linear-gradient(-45deg, rgba(255,255,255,0.5) 25%, transparent 25%)",
          "linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.5) 75%)",
          "linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.5) 75%)",
        ].join(", "),
        backgroundSize: "24px 24px",
        backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0",
      }}
      {...props}
    />
  );
}
