"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useRef, useState } from "react";

import { GNB_CATEGORIES } from "@/constants/gnb-category";
import { useHoverIntent } from "@/hooks/use-hover-intent";
import { cn } from "@/lib/utils";

import { CategoryMegaPanel } from "./category-mega-panel";
import { GnbNav } from "./gnb-nav";
import { Header } from "./header";

/**
 * IA CM-1 글로벌 헤더 전체 — `Header`(1단: 로고+아이콘) + `GnbNav`(2단: 내비) +
 * `CategoryMegaPanel`(CM-2, "전체 카테고리" 호버 시). 이전 `nav-bar-module.tsx`의
 * `default/category/search` variant 조합을 대체한다 — 그 variant들은 CM-2(호버 메가패널)·
 * CM-3(검색 토글 패널) 실제 동작과 맞지 않았다(§`temp/tasks/T-05-*` design.md 참고).
 *
 * `stores/auth`에 의존하지 않는다(`docs/architecture.md` §6) — `authStatus`는 순수
 * 문자열이라 그대로 `Header`에 전달만 한다. store 연동은 `app/site-gnb.tsx`가 한다.
 *
 * `GnbNav`는 `useSearchParams()`를 쓰는데, 이 컴포넌트가 루트 layout을 통해 정적 프리렌더
 * 대상 페이지(`/_not-found` 등)에도 걸리기 때문에 Suspense 경계가 없으면 빌드가 실패한다
 * (Next.js "useSearchParams should be wrapped in a suspense boundary"). fallback은 같은
 * 높이의 빈 바로 둬 레이아웃 시프트를 막는다.
 *
 * **`CategoryMegaPanel`을 여기서 소유·렌더한다** (design.md 최초안은 `GnbNav` 안의 작은
 * 컨테이너에 뒀었다) — Figma `nav-bar-group2`는 헤더와 같은 전체 너비로 펼쳐지는데, 트리거
 * 링크만 감싼 작은 컨테이너에 두면 패널 너비가 트리거 텍스트 너비로 제한된다. 그래서
 * `useHoverIntent`·ESC·바깥 클릭 처리를 전부 이 컴포넌트로 끌어올리고, `GnbNav`는 트리거
 * 링크 렌더 + 이벤트 위임만 한다.
 *
 * 호버로 "열어 두기"의 기준 영역도 트리거 하나가 아니라 **`Gnb` 전체**(헤더+내비+패널)로
 * 넓어졌다 — 검색 아이콘이나 다른 내비 항목으로 마우스가 지나가도 패널이 안 닫히고, 이
 * 영역을 완전히 벗어나야 닫힌다. 대신 "여는" 트리거는 여전히 "전체 카테고리" 링크 하나로
 * 좁게 유지한다(`onMouseEnter`를 그 링크에만 건다) — 그래야 무관한 항목에 마우스를 올렸을
 * 때 패널이 열리지 않는다.
 *
 * 헤더 아래 확장 패널(CM-2 카테고리 메가패널, 추후 CM-3 검색)은 자리를 하나만 공유하고
 * 동시에 열릴 수 없다(IA). 그래서 "어떤 패널이 열려 있는가"를 이 컴포넌트가 단일 소유자로
 * 갖는다 — CM-3가 붙을 때 `GnbOpenPanel`에 `"search"`만 추가하면 상호 배타가 공짜로
 * 보장된다(`temp/tasks/T-06-category-mega-panel/design.md` §3.4).
 *
 * `sticky top-0` — Figma GNB 섹션 주석("Sticky - TOP, 어떤 화면에서도 스크롤 시 상단에
 * 고정되어 사라지지 않음", 노드 `1289:50624`) 반영. 스크롤해도 항상 화면 상단에 고정된다.
 * `z-50`은 `components/ui/select.tsx`의 팝오버와 같은 값 — 스크롤된 페이지 콘텐츠 위에
 * 항상 보이게 한다.
 *
 * 호버 열기·닫기 디바운스는 80ms·150ms(`useHoverIntent` 기본값) — 초안 150ms·300ms는 실제
 * 조작해보니 체감상 느렸다. `activeCategoryName`도 패널이 닫힐 때마다 첫 대분류로 리셋한다
 * (아래 `useEffect`) — 안 그러면 마지막으로 보던 탭이 다음 열림에도 남아 매번 다른 시작
 * 상태가 된다(`temp/tasks/T-06-category-mega-panel/design.md` §6).
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
  const [activeCategoryName, setActiveCategoryName] = useState(
    GNB_CATEGORIES[0].name,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const categoryTriggerRef = useRef<HTMLAnchorElement>(null);

  const isCategoryPanelOpen = openPanel === "category";
  const { open, scheduleOpen, scheduleClose, cancelScheduledClose, close } =
    useHoverIntent({
      isOpen: isCategoryPanelOpen,
      // 닫힐 때(nextOpen === false) 활성 탭도 같이 첫 대분류로 되돌린다 —
      // `activeCategoryName`이 `CategoryMegaPanel`(언마운트됨)이 아니라 `Gnb`에 있어서, 안
      // 돌려놓으면 마지막으로 보던 탭이 다음 열림에도 그대로 남는다. "다시 열면 항상 처음
      // 탭부터"가 더 예측 가능해서 이걸 기본으로 삼는다. 열림·닫힘을 알리는 이 콜백 안에서
      // 바로 처리해 `useEffect` + setState의 캐스케이딩 렌더(`react-hooks/set-state-in-effect`)
      // 를 피한다.
      onOpenChange: (nextOpen) => {
        setOpenPanel(nextOpen ? "category" : null);
        if (!nextOpen) setActiveCategoryName(GNB_CATEGORIES[0].name);
      },
    });

  // ESC — 열려 있을 때만 등록. 패널이 언마운트되면서 포커스가 사라지지 않도록 트리거로
  // 되돌린다(리뷰 F1) — 바깥 클릭·컨테이너 이탈 blur는 사용자가 이미 다른 곳으로 포커스를
  // 옮기는 중이라 그대로 두고, ESC만 "제자리로 복귀"로 다룬다.
  useEffect(() => {
    if (!isCategoryPanelOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        categoryTriggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCategoryPanelOpen, close]);

  // 바깥 클릭 — GNB 전체(헤더+내비+패널) 밖을 누르면 닫는다.
  useEffect(() => {
    if (!isCategoryPanelOpen) return;
    function handleMouseDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isCategoryPanelOpen, close]);

  return (
    <div
      ref={rootRef}
      data-slot="gnb"
      className={cn("relative sticky top-0 z-50 shadow-nav", className)}
      onMouseEnter={cancelScheduledClose}
      onMouseLeave={scheduleClose}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) close();
      }}
    >
      <Header logo={logo} authStatus={authStatus} cartCount={cartCount} />
      <Suspense
        fallback={
          <div aria-hidden="true" className="h-13 bg-fill-neutral-impact" />
        }
      >
        <GnbNav
          isCategoryPanelOpen={isCategoryPanelOpen}
          categoryTriggerRef={categoryTriggerRef}
          onCategoryTriggerMouseEnter={scheduleOpen}
          onCategoryTriggerFocus={open}
        />
      </Suspense>
      {isCategoryPanelOpen && (
        <CategoryMegaPanel
          categories={GNB_CATEGORIES}
          activeCategoryName={activeCategoryName}
          onActiveCategoryChange={(name) => {
            setActiveCategoryName(name);
            open();
            cancelScheduledClose();
          }}
          className="w-full"
        />
      )}
    </div>
  );
}

export { Gnb };
export type { GnbProps };
