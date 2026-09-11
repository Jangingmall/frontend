import type { ReactNode } from "react";
import { Suspense } from "react";

import { cn } from "@/lib/utils";

import { GnbNav } from "./gnb-nav";
import { Header } from "./header";

/**
 * IA CM-1 글로벌 헤더 전체 — `Header`(1단: 로고+아이콘) + `GnbNav`(2단: 내비). 이전
 * `nav-bar-module.tsx`의 `default/category/search` variant 조합을 대체한다 — 그 variant들은
 * CM-2(호버 메가패널)·CM-3(검색 토글 패널) 실제 동작과 맞지 않았다(§`temp/tasks/T-05-*`
 * design.md 참고).
 *
 * `stores/auth`에 의존하지 않는다(`docs/architecture.md` §6) — `authStatus`는 순수
 * 문자열이라 그대로 `Header`에 전달만 한다. store 연동은 `app/site-gnb.tsx`가 한다.
 *
 * `GnbNav`는 `useSearchParams()`를 쓰는데, 이 컴포넌트가 루트 layout을 통해 정적 프리렌더
 * 대상 페이지(`/_not-found` 등)에도 걸리기 때문에 Suspense 경계가 없으면 빌드가 실패한다
 * (Next.js "useSearchParams should be wrapped in a suspense boundary"). fallback은 같은
 * 높이의 빈 바로 둬 레이아웃 시프트를 막는다.
 */
interface GnbProps {
  logo?: ReactNode;
  authStatus?: "loading" | "anonymous" | "authenticated";
  /** T-13(`stores/cart`) 전까지는 항상 비어 있다 → Header 기본값 0, 뱃지 숨김. */
  cartCount?: number;
  className?: string;
}

function Gnb({ logo, authStatus, cartCount, className }: GnbProps) {
  return (
    <div data-slot="gnb" className={cn("shadow-nav", className)}>
      <Header logo={logo} authStatus={authStatus} cartCount={cartCount} />
      <Suspense
        fallback={
          <div aria-hidden="true" className="h-13 bg-fill-neutral-impact" />
        }
      >
        <GnbNav />
      </Suspense>
    </div>
  );
}

export { Gnb };
export type { GnbProps };
