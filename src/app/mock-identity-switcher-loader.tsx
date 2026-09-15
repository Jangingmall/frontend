"use client";

import dynamic from "next/dynamic";

/**
 * `MockIdentitySwitcher`(`mock-identity-switcher.tsx`)를 `ssr: false`로 감싸는 얇은 Client
 * Component 경계.
 *
 * `next/dynamic`의 `ssr: false`는 Server Component(루트 `layout.tsx`)에서 직접 못 쓴다
 * ("`ssr: false` is not allowed with `next/dynamic` in Server Components") — 그래서 이
 * 파일 하나를 사이에 둔다. `layout.tsx`는 이 파일을 평범하게 import하기만 하면 된다.
 *
 * `ssr: false`를 쓰는 이유는 버그 회피가 아니라 이 컴포넌트의 성격이다 — mock 전용 dev
 * 도구라 서버 렌더·정적 생성(SSG) 결과물에 애초에 나타날 이유가 없다(SEO·최초 페인트와
 * 무관, hydration 이후 등장해도 상관없음). 서버에서 그릴 이유가 없는 걸 굳이 그리지 않는
 * 것뿐이다.
 *
 * (참고, 2026-09-15) 처음엔 `npm run build`의 "/" 정적 생성이 60초 타임아웃을 반복해서
 * 넘기는 걸 보고 이 컴포넌트가 원인이라 의심해 `ssr: false`를 도입했는데, 이후 이 컴포넌트를
 * 완전히 빼고 다시 빌드해도 같은 증상(60초 타임아웃 2회 뒤 3번째 시도에서 겨우 통과, 총
 * 2.7분)이 재현돼 무관함이 확인됐다 — 이 세션 동안 백그라운드로 반복 실행한 여러 `npm run
 * build`·사용자의 `npm run dev`·Storybook dev 서버 등이 동시에 떠 있어 생긴 CPU 경합으로
 * 보인다(코드 회귀 아님). `ssr: false` 자체는 원인과 무관하게 여전히 맞는 선택이라 그대로
 * 둔다.
 */
export const MockIdentitySwitcher = dynamic(
  () => import("./mock-identity-switcher").then((m) => m.MockIdentitySwitcher),
  { ssr: false },
);
