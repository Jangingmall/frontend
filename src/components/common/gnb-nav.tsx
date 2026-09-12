"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { RefObject } from "react";

import { cn } from "@/lib/utils";

/**
 * IA CM-1 2단 — 내비 행. `docs/routing-and-auth.md` §2.1·§3, 팀 IA 시트(`98826581` 탭 CM-1
 * 행) 기준. 항목마다 드롭다운이 달린 이전 `nav-bar.tsx` 셸과 달리 완전히 평평한 링크 목록이다
 * — 「전체 카테고리」만 CM-2 메가패널이 붙은 특수 항목이고, CM-3(검색 토글)은 별도 작업(T-07)이
 * 붙인다.
 *
 * 메가패널(`CategoryMegaPanel`) 자체와 그 열림 상태·호버 로직은 이 컴포넌트가 안 갖는다 —
 * 패널이 헤더 전체 너비로 펼쳐져야 해서(Figma `nav-bar-group2`) `Gnb`가 소유하고 렌더한다.
 * `GnbNav`는 트리거 링크만 그리고, 호버·포커스 이벤트를 `Gnb`가 준 콜백에 그대로 위임한다
 * (`temp/tasks/T-06-category-mega-panel/design.md` §3.3 갱신 — 최초 설계는 패널을 이 컴포넌트
 * 안의 작은 컨테이너에 뒀으나, 그러면 패널 너비가 트리거 텍스트 너비로 제한돼 Figma와
 * 어긋났다).
 *
 * 「장인관」·「기획전」은 목적지 라우트가 없어 `disabled` — 다른 항목과 같은 텍스트 스타일을
 * 유지하고 hover 배경 변화만 뺀다(흐리게 처리하지 않음, 사용자 결정).
 */
interface GnbNavItem {
  label: string;
  /** disabled 항목은 목적지가 없어 href를 안 둔다. */
  href?: Route;
  disabled?: boolean;
}

const GNB_NAV_ITEMS: GnbNavItem[] = [
  { label: "장인관", disabled: true },
  { label: "신상품", href: "/products?preset=new" as Route },
  { label: "베스트", href: "/products?preset=best" as Route },
  { label: "기획전", disabled: true },
];

const CATEGORY_TRIGGER_HREF = "/products" as Route;

/**
 * 현재 URL이 이 내비 항목의 목적지인지 판정한다. pathname만으로는 안 된다 — 전체 카테고리·
 * 신상품·베스트가 전부 `/products`를 공유하고 `preset` 쿼리로만 구분되기 때문(§3). `category`
 * 는 지금 어떤 항목도 안 쓰지만, PL-2/3(`/products?category=`)에서 이 셋이 잘못 활성화되지
 * 않으려면 같이 체크해야 한다.
 */
function isGnbNavItemActive(
  href: string,
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  const url = new URL(href, "http://localhost");
  if (url.pathname !== pathname) return false;
  return (["preset", "category"] as const).every(
    (key) => url.searchParams.get(key) === searchParams.get(key),
  );
}

const ITEM_CLASS =
  "flex items-center rounded-xs px-6 py-4 text-body-m text-font-white transition-colors";

interface GnbNavProps {
  className?: string;
  /** 카테고리 메가패널 열림 여부. `Gnb`가 소유(§3.4) — 트리거 강조 스타일에만 쓴다. */
  isCategoryPanelOpen: boolean;
  categoryTriggerRef: RefObject<HTMLAnchorElement | null>;
  /** 디바운스된 열기 예약(`useHoverIntent.scheduleOpen`). */
  onCategoryTriggerMouseEnter: () => void;
  /** 디바운스 없는 즉시 열기(`useHoverIntent.open`) — 키보드 포커스용. */
  onCategoryTriggerFocus: () => void;
}

function GnbNav({
  className,
  isCategoryPanelOpen,
  categoryTriggerRef,
  onCategoryTriggerMouseEnter,
  onCategoryTriggerFocus,
}: GnbNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryActive = isGnbNavItemActive(
    CATEGORY_TRIGGER_HREF,
    pathname,
    searchParams,
  );

  return (
    <nav
      aria-label="글로벌 내비게이션"
      className={cn("flex bg-fill-neutral-impact px-8", className)}
    >
      <Link
        ref={categoryTriggerRef}
        href={CATEGORY_TRIGGER_HREF}
        onMouseEnter={onCategoryTriggerMouseEnter}
        onFocus={onCategoryTriggerFocus}
        aria-current={categoryActive ? "page" : undefined}
        className={cn(
          ITEM_CLASS,
          isCategoryPanelOpen
            ? "bg-(--nav-jade) text-font-dark"
            : "hover:bg-states-hover-25",
          categoryActive && "font-bold",
        )}
      >
        전체 카테고리
      </Link>
      {GNB_NAV_ITEMS.map((item) => {
        if (item.disabled || !item.href) {
          return (
            <span key={item.label} aria-disabled="true" className={ITEM_CLASS}>
              {item.label}
            </span>
          );
        }

        const active = isGnbNavItemActive(item.href, pathname, searchParams);

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              ITEM_CLASS,
              "hover:bg-states-hover-25",
              active && "font-bold",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export { GnbNav, isGnbNavItemActive };
export type { GnbNavItem, GnbNavProps };
