import type { SVGProps } from "react";

/**
 * 미담 로고(확정본, 단일 색). 색은 `fill="currentColor"`라 `text-*` 클래스로 정한다 — 짙은
 * 배경(헤더·푸터)은 `text-font-white`, 밝은 배경(모바일 메뉴)은 `text-font-dark`. 검정/흰색
 * 원본 SVG는 색만 다른 동일 path라 컴포넌트 하나로 통합했다.
 *
 * 장식이 아니라 링크 안에 들어가는 이미지이므로 접근 가능한 이름은 감싸는 링크의
 * `aria-label`(예: "홈으로 이동")이 맡고 SVG는 `aria-hidden`이다.
 */
export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 77 36"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className="h-8 w-auto"
      {...props}
    >
      <path d="M74 32V25.2H44.4V33.2H72.8V36H41.6V22.4H76.8V32C76.8 34.2092 75.0091 36 72.8 36V33.2C73.4627 33.2 74 32.6628 74 32Z" />
      <path d="M60.8 0.199974V2.99997H44.6008L44.6 15.4H60.7992V18.2H41.8L41.8008 0.199974H60.8Z" />
      <path d="M37.394 -8.08815e-08L37.394 36L34.594 36L34.594 0L37.394 -8.08815e-08Z" />
      <path d="M65 8.08815e-08L65 18.4L67.8 18.4L67.8 0L65 8.08815e-08Z" />
      <path d="M75.2 9.4C75.2 10.615 74.215 11.6 73 11.6C71.785 11.6 70.8 10.615 70.8 9.4C70.8 8.18497 71.785 7.2 73 7.2C74.215 7.2 75.2 8.18497 75.2 9.4Z" />
      <path d="M30.4001 0V35.9999H0V3.99999C0 1.79086 1.79086 1.22064e-07 4.00001 0H30.4001ZM2.8 33.1999H27.6V2.79999H4.00001C3.33726 2.79999 2.8 3.33725 2.8 3.99999V33.1999Z" />
    </svg>
  );
}
