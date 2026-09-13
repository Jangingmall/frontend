"use client";

import type { ComponentProps, ReactNode } from "react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { GNB_CATEGORIES } from "@/constants/gnb-category";
import { useHoverIntent } from "@/hooks/use-hover-intent";
import { cn } from "@/lib/utils";

import { CategoryMegaPanel } from "./category-mega-panel";
import { GnbNav } from "./gnb-nav";
import { Header } from "./header";
import { SearchPanel } from "./search-panel";

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
 * 헤더 아래 확장 패널(CM-2 카테고리 메가패널, CM-3 검색)은 자리를 하나만 공유하고 동시에 열릴
 * 수 없다(IA). 그래서 "어떤 패널이 열려 있는가"를 `GnbOpenPanel` 유니온으로 이 컴포넌트가 단일
 * 소유하고, 조건부 렌더 하나로 상호 배타를 보장한다(`temp/tasks/T-06-category-mega-panel/design.md`
 * §3.4, `temp/tasks/T-07-search-panel/design.md` §3.3).
 *
 * 검색은 카테고리와 달리 **호버가 아니라 클릭 토글**이라(IA CM-3) `useHoverIntent`를 안 쓰고
 * `openPanel`을 직접 `setOpenPanel`한다. 그래서 루트의 호버 전용 핸들러
 * (`onMouseEnter`/`onMouseLeave`/`onBlur` — 원래 카테고리 하나만 있을 때 만들어진 것)를
 * `categoryHoverProps`로 묶어 **카테고리 패널이 열려 있을 때만** 등록한다 — 가드가 없으면
 * 검색 패널이 열려 있는 동안 마우스가 GNB 밖으로 나가는 것만으로 카테고리용
 * `scheduleClose`가 300ms 뒤 `openPanel`을 무조건 `null`로 덮어써 검색 패널까지 닫혀 버린다
 * (IA엔 없는 동작 — `temp/tasks/T-07-search-panel/design.md` §5-5, `gnb.test.tsx`의 회귀
 * 테스트로 고정).
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
type GnbOpenPanel = "category" | "search" | null;

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
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  const isCategoryPanelOpen = openPanel === "category";
  const isSearchPanelOpen = openPanel === "search";
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

  // 검색 토글 클릭 — 호버 디바운스 없이 즉시 전환(IA CM-3는 클릭 토글). `close()`를
  // `isCategoryPanelOpen` 여부와 무관하게 항상 먼저 호출한다 — 카테고리가 실제로 열려
  // 있었다면 정식으로 닫아 `activeCategoryName`도 리셋하고(위 `onOpenChange`), 카테고리가
  // 아직 안 열렸어도(호버 직후 `scheduleOpen`이 건 80ms 타이머가 남아 있는 상태) 그 예약을
  // 지운다 — 안 지우면 타이머가 만료될 때 `onOpenChange(true)`가 현재 상태를 안 보고 그냥
  // `openPanel`을 `"category"`로 덮어써, 방금 연 검색 패널이 사라지고 카테고리가 열려버린다
  // (코드 리뷰 F2). `close()`는 열려 있지 않으면 `onOpenChange`를 안 부르고 타이머만
  // 정리하므로 평범한 경우엔 부작용이 없다. 바로 다음 줄의 `setOpenPanel("search")`가
  // `close()`의 결과(둘 다 `null`을 향함)를 덮어써 최종적으로 검색만 열린다.
  function handleSearchTriggerClick() {
    if (isSearchPanelOpen) {
      setOpenPanel(null);
      return;
    }
    close();
    setOpenPanel("search");
  }

  // 열려 있는 패널이 무엇이든 닫는다 — ESC·바깥 클릭이 공유하는 경로. `close`는
  // `useHoverIntent`가 안정된 참조로 주므로, 이 콜백도 `isCategoryPanelOpen`·
  // `isSearchPanelOpen`이 바뀔 때만 새로 만들어진다.
  const closeOpenPanel = useCallback(() => {
    if (isCategoryPanelOpen) close();
    else if (isSearchPanelOpen) setOpenPanel(null);
  }, [isCategoryPanelOpen, isSearchPanelOpen, close]);

  // ESC — 아무 패널이나 열려 있을 때 등록. 패널이 언마운트되면서 포커스가 사라지지 않도록
  // 열려 있던 패널의 트리거로 되돌린다(리뷰 F1) — 바깥 클릭·컨테이너 이탈 blur는 사용자가
  // 이미 다른 곳으로 포커스를 옮기는 중이라 그대로 두고, ESC만 "제자리로 복귀"로 다룬다.
  useEffect(() => {
    if (openPanel === null) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      closeOpenPanel();
      (isCategoryPanelOpen
        ? categoryTriggerRef
        : searchTriggerRef
      ).current?.focus();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openPanel, isCategoryPanelOpen, closeOpenPanel]);

  // 바깥 클릭 — GNB 전체(헤더+내비+패널) 밖을 누르면, 열려 있는 패널이 무엇이든 닫는다.
  useEffect(() => {
    if (openPanel === null) return;
    function handleMouseDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closeOpenPanel();
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [openPanel, closeOpenPanel]);

  // 카테고리 전용 호버 핸들러 묶음 — 카테고리 패널이 열려 있을 때만 셋 다 등록한다(위 docblock
  // 참고). `isCategoryPanelOpen`이 거짓이면 빈 객체라 스프레드해도 아무 핸들러도 안 붙는다.
  const categoryHoverProps: Pick<
    ComponentProps<"div">,
    "onMouseEnter" | "onMouseLeave" | "onBlur"
  > = isCategoryPanelOpen
    ? {
        onMouseEnter: cancelScheduledClose,
        onMouseLeave: scheduleClose,
        onBlur: (event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node)) close();
        },
      }
    : {};

  return (
    <div
      ref={rootRef}
      data-slot="gnb"
      className={cn("relative sticky top-0 z-50 shadow-nav", className)}
      {...categoryHoverProps}
    >
      <Header
        logo={logo}
        authStatus={authStatus}
        cartCount={cartCount}
        isSearchPanelOpen={isSearchPanelOpen}
        onSearchTriggerClick={handleSearchTriggerClick}
        searchTriggerRef={searchTriggerRef}
      />
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
      {isSearchPanelOpen && (
        <SearchPanel onClose={() => setOpenPanel(null)} className="w-full" />
      )}
    </div>
  );
}

export { Gnb };
export type { GnbProps };
