"use client";

import type { ReactNode } from "react";

import { SearchField } from "@/components/ui/search-field";
import { cn } from "@/lib/utils";

import { Header } from "./header";
import type { NavMenuItem, NavPrimaryItem } from "./nav-bar";
import { NavBar } from "./nav-bar";

/**
 * Figma `[FE] Components / usage of nav-bar` 의 `nav-bar-module` set. Header + NavBar 를
 * 조합한 사이트 상단 전체 모듈. `shadow-nav` 적용.
 *   - `default`  : Header + 1차 카테고리 행
 *   - `category` : Header + 1차 + 2차 메가메뉴 행 (Figma `category` / `category-pressed`)
 *   - `search`   : Header + 1차 카테고리 행 + 검색 입력 행
 * Figma `category-pressed` 는 `category` 에서 메뉴 하나가 열린 런타임 상태라 별도 variant 로
 * 두지 않는다.
 */
interface NavBarModuleProps {
  variant?: "default" | "category" | "search";
  /** Header */
  logo?: ReactNode;
  endActions?: ReactNode;
  cartCount?: number;
  /** NavBar */
  primaryItems?: NavPrimaryItem[];
  menuItems?: NavMenuItem[];
  /** search variant */
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  className?: string;
}

function NavBarModule({
  variant = "default",
  logo,
  endActions,
  cartCount,
  primaryItems,
  menuItems,
  searchPlaceholder,
  onSearch,
  className,
}: NavBarModuleProps) {
  return (
    <div data-slot="nav-bar-module" className={cn("shadow-nav", className)}>
      <Header logo={logo} endActions={endActions} cartCount={cartCount} />
      <NavBar
        rows={variant === "category" ? "all" : "primary"}
        primaryItems={primaryItems}
        menuItems={menuItems}
      />
      {variant === "search" && (
        <div className="bg-bg-default px-12 py-3">
          <SearchField
            placeholder={searchPlaceholder ?? "검색어를 입력해주세요."}
            onSearch={onSearch}
          />
        </div>
      )}
    </div>
  );
}

export { NavBarModule };
export type { NavBarModuleProps };
