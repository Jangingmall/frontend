"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * IA CM-1 2단 — 내비 행. `docs/routing-and-auth.md` §2.1·§3, 팀 IA 시트(`98826581` 탭 CM-1
 * 행) 기준. 항목마다 드롭다운이 달린 이전 `nav-bar.tsx` 셸과 달리 완전히 평평한 링크 목록이다
 * — 「전체 카테고리」의 호버 메가패널(CM-2)·검색 토글(CM-3)은 별도 작업(T-06·T-07)이 붙인다.
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
  { label: "전체 카테고리", href: "/products" as Route },
  { label: "장인관", disabled: true },
  { label: "신상품", href: "/products?preset=new" as Route },
  { label: "베스트", href: "/products?preset=best" as Route },
  { label: "기획전", disabled: true },
];

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

function GnbNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav
      aria-label="글로벌 내비게이션"
      className={cn("flex bg-fill-neutral-impact px-8", className)}
    >
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
export type { GnbNavItem };
