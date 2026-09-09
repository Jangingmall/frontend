import localFont from "next/font/local";

/**
 * Pretendard variable 폰트. `layout.tsx` 의 전역 적용과 Storybook `preview` 데코레이터가
 * 같은 인스턴스를 공유하도록 별도 모듈로 분리한다 — Storybook 은 `layout.tsx` 를 렌더링하지
 * 않아서, 이 파일이 없으면 스토리에서 `--font-pretendard` 가 비어 serif 로 fallback 된다.
 */
export const pretendard = localFont({
  src: "../assets/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "100 900",
  display: "swap",
});
