"use client";

import type { ReactNode } from "react";
import { Suspense, useState } from "react";

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
 *
 * 헤더 아래 확장 패널(CM-2 카테고리 메가패널, 추후 CM-3 검색)은 자리를 하나만 공유하고
 * 동시에 열릴 수 없다(IA). 그래서 "어떤 패널이 열려 있는가"를 이 컴포넌트가 단일 소유자로
 * 갖고 `GnbNav`엔 파생 값만 내려준다 — CM-3가 붙을 때 `GnbOpenPanel`에 `"search"`만 추가하면
 * 상호 배타가 공짜로 보장된다(`temp/tasks/T-06-category-mega-panel/design.md` §3.4).
 * `useState` 도입으로 이 컴포넌트가 Client Component가 됐다.
 *
 * `sticky top-0` — Figma GNB 섹션 주석("Sticky - TOP, 어떤 화면에서도 스크롤 시 상단에
 * 고정되어 사라지지 않음", 노드 `1289:50624`) 반영. 스크롤해도 항상 화면 상단에 고정된다.
 * `z-50`은 `components/ui/select.tsx`의 팝오버와 같은 값 — 스크롤된 페이지 콘텐츠 위에
 * 항상 보이게 한다.
 */
type GnbOpenPanel = "category" | null;

interface GnbProps {
  logo?: ReactNode;
  authStatus?: "loading" | "anonymous" | "authenticated";
  /** T-13(`stores/cart`) 전까지는 항상 비어 있다 → Header 기본값 0, 뱃지 숨김. */
  cartCount?: number;
  className?: string;
}

function Gnb({ logo, authStatus, cartCount, className }: GnbProps) {
  const [openPanel, setOpenPanel] = useState<GnbOpenPanel>(null);

  return (
    <div
      data-slot="gnb"
      className={cn("sticky top-0 z-50 shadow-nav", className)}
    >
      <Header logo={logo} authStatus={authStatus} cartCount={cartCount} />
      <Suspense
        fallback={
          <div aria-hidden="true" className="h-13 bg-fill-neutral-impact" />
        }
      >
        <GnbNav
          isCategoryPanelOpen={openPanel === "category"}
          onCategoryPanelOpenChange={(open) =>
            setOpenPanel(open ? "category" : null)
          }
        />
      </Suspense>
    </div>
  );
}

export { Gnb };
export type { GnbProps };
