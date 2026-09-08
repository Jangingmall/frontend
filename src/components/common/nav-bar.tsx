"use client";

import { NavigationMenu } from "@base-ui/react/navigation-menu";
import type { ReactNode } from "react";

import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / Navigation-bar` 의 `nav-bar-group1` + `nav-bar-group2`(+ `-group3`).
 * 2행 구성:
 *   - Row 1: `--nav-bg`(#121B29) 바, 1차 카테고리 텍스트 링크 (`primaryItems`)
 *   - Row 2: `--nav-menu-fill`(#414954) 바, 드롭다운 달린 카테고리 버튼 (`menuItems`).
 *     hover/focus 시 아래에 흰 메가메뉴 패널(3열 링크 그리드, `shadow-nav`). base-ui
 *     `NavigationMenu` 로 hover·키보드·focus 처리.
 *
 * Item 의 *타입*은 Figma 디자인에서 확정 가능하지만 실제 카테고리 데이터는 미정 — 기본값은
 * 샘플. 반응형(모바일)은 미정.
 */
interface NavPrimaryItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

interface NavMenuGroup {
  /** 메가메뉴 안 소그룹 제목 (없으면 제목 없는 링크 열) */
  title?: string;
  links: { label: string; href: string }[];
}

interface NavMenuItem {
  label: string;
  href: string;
  /** 메가메뉴 소그룹들. 패널에서 가로로 나열된다. */
  menu?: NavMenuGroup[];
}

const SAMPLE_MENU: NavMenuGroup[] = Array.from({ length: 3 }, () => ({
  links: Array.from({ length: 5 }, (_, i) => ({
    label: `노리개 · 브로치 ${i + 1}`,
    href: "#",
  })),
}));

const DEFAULT_PRIMARY: NavPrimaryItem[] = [
  { label: "전체 카테고리", href: "#" },
  { label: "전체 상품", href: "#" },
  { label: "선물관", href: "#" },
  { label: "장인관", href: "#" },
  { label: "신상품", href: "#" },
  { label: "베스트", href: "#" },
];

const DEFAULT_MENU_ITEMS: NavMenuItem[] = Array.from({ length: 7 }, () => ({
  label: "키친 · 다이닝",
  href: "#",
  menu: SAMPLE_MENU,
}));

interface NavBarProps {
  primaryItems?: NavPrimaryItem[];
  menuItems?: NavMenuItem[];
  className?: string;
}

function NavBar({
  primaryItems = DEFAULT_PRIMARY,
  menuItems = DEFAULT_MENU_ITEMS,
  className,
}: NavBarProps) {
  return (
    <div data-slot="nav-bar" className={cn("flex flex-col", className)}>
      {/* Row 1 — 1차 카테고리 */}
      <nav
        aria-label="전체 카테고리"
        className="flex bg-fill-neutral-impact px-8"
      >
        {primaryItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-2 rounded-xs px-6 py-4 text-body-m text-font-white transition-colors hover:bg-states-hover-25 [&_path]:fill-current"
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      {/* Row 2 — 카테고리 + 메가메뉴 */}
      <NavigationMenu.Root className="relative bg-(--nav-menu-fill)">
        <NavigationMenu.List className="flex px-8">
          {menuItems.map((item, i) => (
            <NavigationMenu.Item key={`${item.label}-${i}`}>
              <NavigationMenu.Trigger className="group/navtrigger flex items-center gap-1 rounded-xs px-6 py-3 text-body-m text-font-white transition-colors outline-none hover:bg-states-hover-25 data-popup-open:bg-states-hover-25 data-popup-open:font-bold">
                {item.label}
                {item.menu && item.menu.length > 0 && (
                  <ChevronDownIcon className="size-4 transition-transform group-data-popup-open/navtrigger:-rotate-180 [&_path]:fill-current" />
                )}
              </NavigationMenu.Trigger>
              {item.menu && item.menu.length > 0 && (
                <NavigationMenu.Content className="flex gap-3 px-8 pt-4 pb-6">
                  {item.menu.map((group, gi) => (
                    <div
                      key={group.title ?? gi}
                      className="flex min-w-33 flex-col"
                    >
                      {group.title && (
                        <span className="text-body-m-btn px-6 py-3 text-font-dark">
                          {group.title}
                        </span>
                      )}
                      {group.links.map((link) => (
                        <NavigationMenu.Link
                          key={link.label}
                          href={link.href}
                          className="rounded-xs px-6 py-3 text-body-m text-font-dark transition-colors hover:bg-states-hover"
                        >
                          {link.label}
                        </NavigationMenu.Link>
                      ))}
                    </div>
                  ))}
                </NavigationMenu.Content>
              )}
            </NavigationMenu.Item>
          ))}
        </NavigationMenu.List>

        <NavigationMenu.Portal>
          <NavigationMenu.Positioner
            className="z-50 outline-none"
            sideOffset={0}
            align="start"
          >
            <NavigationMenu.Popup className="bg-bg-default shadow-nav">
              <NavigationMenu.Viewport />
            </NavigationMenu.Popup>
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      </NavigationMenu.Root>
    </div>
  );
}

export { NavBar };
export type { NavBarProps, NavPrimaryItem, NavMenuItem, NavMenuGroup };
