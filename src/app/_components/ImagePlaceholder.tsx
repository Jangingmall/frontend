import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * 실제 이미지 자산이 없는 자리를 표시하는 체크보드 패턴.
 *
 * `ProductCard`가 이미지 로드 실패 시 쓰는 `/images/product-placeholder.png`를 그대로
 * 배경 이미지로 쓴다 — 직접 그린 CSS 그라디언트(1차 시도)는 색이 이 파일과 달랐고
 * (`#fafafa`/`#ebebeb` 체크가 아니라 임의로 고른 흰색 반투명 위 `bg-skeleton`), 체크 크기도
 * 24px로 고정이라 박스 폭이 달라져도 그대로였다. `background-size: cover`로 바꾸면
 * 256×256 원본(16px 체크 16×16개)이 박스 폭에 맞춰 통째로 늘어나 체크 크기도 함께
 * 커진다 — `ProductCard`용 파일이라 정사각형 기준으로 만들어졌지만, `cover`는 종횡비를
 * 유지해 늘어놓든(히어로처럼 가로로 넓은 박스) 정사각형이든 체크가 찌그러지지 않는다.
 */
export function ImagePlaceholder({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-bg-skeleton", className)}
      style={{
        backgroundImage: "url(/images/product-placeholder.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      {...props}
    />
  );
}
