"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { GNB_CATEGORIES } from "@/constants/gnb-category";
import { useHoverIntent } from "@/hooks/use-hover-intent";
import { cn } from "@/lib/utils";

import { CategoryMegaPanel } from "./category-mega-panel";

/**
 * IA CM-1 2단 — 내비 행. `docs/routing-and-auth.md` §2.1·§3, 팀 IA 시트(`98826581` 탭 CM-1
 * 행) 기준. 항목마다 드롭다운이 달린 이전 `nav-bar.tsx` 셸과 달리 완전히 평평한 링크 목록이다
 * — 「전체 카테고리」만 CM-2 메가패널(`CategoryMegaPanel`)이 붙은 특수 항목이고, CM-3(검색
 * 토글)은 별도 작업(T-07)이 붙인다.
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
  /** 카테고리 메가패널 열림 여부. `Gnb`가 소유한다(§3.4, CM-3와의 상호 배타 대비). */
  isCategoryPanelOpen: boolean;
  onCategoryPanelOpenChange: (open: boolean) => void;
}

function GnbNav({
  className,
  isCategoryPanelOpen,
  onCategoryPanelOpenChange,
}: GnbNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeCategoryName, setActiveCategoryName] = useState(
    GNB_CATEGORIES[0].name,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const { open, scheduleOpen, scheduleClose, cancelScheduledClose, close } =
    useHoverIntent({
      isOpen: isCategoryPanelOpen,
      onOpenChange: onCategoryPanelOpenChange,
    });

  // ESC — 열려 있을 때만 등록.
  useEffect(() => {
    if (!isCategoryPanelOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCategoryPanelOpen, close]);

  // 바깥 클릭 — 컨테이너 밖을 누르면 닫는다.
  useEffect(() => {
    if (!isCategoryPanelOpen) return;
    function handleMouseDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isCategoryPanelOpen, close]);

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
      <div
        ref={containerRef}
        className="relative"
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onBlur={(event) => {
          if (!containerRef.current?.contains(event.relatedTarget as Node)) {
            close();
          }
        }}
      >
        <Link
          href={CATEGORY_TRIGGER_HREF}
          onFocus={open}
          aria-current={categoryActive ? "page" : undefined}
          className={cn(
            ITEM_CLASS,
            "hover:bg-states-hover-25",
            categoryActive && "font-bold",
          )}
        >
          전체 카테고리
        </Link>
        {isCategoryPanelOpen && (
          <CategoryMegaPanel
            categories={GNB_CATEGORIES}
            activeCategoryName={activeCategoryName}
            onActiveCategoryChange={(name) => {
              setActiveCategoryName(name);
              open();
              cancelScheduledClose();
            }}
          />
        )}
      </div>
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
