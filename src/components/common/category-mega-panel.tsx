import type { Route } from "next";
import Link from "next/link";

import { ChevronRightIcon } from "@/components/ui/icons";
import { type GnbCategory, toGnbCategoryCode } from "@/constants/gnb-category";
import { cn } from "@/lib/utils";

/**
 * IA CM-2 전체 카테고리 메가패널의 본문 — 대분류 탭 + 활성 탭의 소분류 그리드.
 * (`temp/tasks/T-06-category-mega-panel/design.md` §2.2·§3.2)
 *
 * 열림·닫힘 자체는 안 다룬다 — 부모(`Gnb`)가 조건부 렌더로 마운트/언마운트한다. 순수
 * 프레젠테이션이라 `api`·`queries`·`stores`를 참조하지 않는다(`docs/architecture.md` §8.2).
 *
 * 대분류 탭 바(`aria-label="대분류"`)는 `w-full`로 헤더와 같은 너비까지 펼치고, 그 안쪽 배경은
 * `--nav-menu-fill`(컴포넌트 전용 nav 토큰, `globals.css` "Component 색상" 절 —
 * `bg-(--nav-menu-fill)`처럼 괄호 shorthand로 직접 소비)을 쓴다.
 *
 * **소분류 그리드는 활성 탭 버튼 자신의 자식으로 붙인다.** Figma 원본도 그렇다 —
 * `nav-bar-group3`(소분류 그리드)는 헤더 왼쪽 끝에 고정된 별도 블록이 아니라, 각
 * `nav-bar-group2-button` 인스턴스 안에 중첩돼 있어서 버튼의 x 좌표를 그대로 물려받는다
 * (실측: 7개 탭 각각의 버튼 bbox.x와 그 자식 `nav-bar-group3`의 bbox.x가 전부 동일). 그래서
 * 각 탭을 `relative` 래퍼로 감싸고, 그 탭이 활성일 때만 자식으로 `absolute left-0 top-full`
 * 그리드를 붙인다 — 탭을 바꾸면 그리드도 그 탭의 x 위치를 따라간다.
 *
 * 치수·색상은 Figma GUI 파일(`ZSESuanQor1IT8mr67JjmI`) `814:27100`(nav-bar-module 인스턴스)
 * 노드의 실측값을 그대로 옮겼다 — 패널(`nav-bar-group3`) 패딩 32/16/32/24, 열 간격 12,
 * 그림자 `0 4px 12px rgba(0,0,0,.08)`(= `--shadow-nav`), 각 항목 버튼 패딩 24/12·radius 2,
 * 행 간격은 버튼 자체 패딩으로 만들어져 별도 gap이 없다. 활성 대분류 탭의 배경은
 * `jade-blue-400`을 아주 낮은 투명도(Stateslayer fill 0.25 × layer opacity 0.3 = 7.5%)로
 * 얹은 옅은 틴트다 — 정확한 7.5%에 대응하는 semantic token이 없어(`docs/ui-system.md` §3.2)
 * 원시 토큰(`--jade-blue-400`)에 직접 불투명도를 실측값 그대로 지정한다.
 */
interface CategoryMegaPanelProps {
  categories: GnbCategory[];
  activeCategoryName: string;
  onActiveCategoryChange: (name: string) => void;
  className?: string;
}

function toProductsHref(name: string): Route {
  return `/products?category=${toGnbCategoryCode(name)}` as Route;
}

const SUBCATEGORY_ITEM_CLASS =
  "rounded-xs px-6 py-3 text-body-m whitespace-nowrap text-font-dark transition-colors hover:bg-fill-neutral-weak";

function CategoryMegaPanel({
  categories,
  activeCategoryName,
  onActiveCategoryChange,
  className,
}: CategoryMegaPanelProps) {
  return (
    <div
      data-slot="category-mega-panel"
      className={cn("absolute top-full left-0 w-full", className)}
    >
      <div aria-label="대분류" className="flex bg-(--nav-menu-fill) px-8">
        {categories.map((category) => {
          const active = category.name === activeCategoryName;
          return (
            <div key={category.name} className="relative">
              <Link
                href={toProductsHref(category.name)}
                onMouseEnter={() => onActiveCategoryChange(category.name)}
                onFocus={() => onActiveCategoryChange(category.name)}
                className={cn(
                  "flex shrink-0 items-center gap-1 px-6 py-3 text-body-m whitespace-nowrap text-font-white transition-colors [&_path]:fill-current",
                  active
                    ? "bg-(--jade-blue-400)/[0.075]"
                    : "hover:bg-states-hover-25",
                )}
              >
                {category.name}
                {active && <ChevronRightIcon className="size-4" />}
              </Link>
              {active && (
                <div className="absolute top-full left-0 w-fit bg-bg-default px-8 pt-4 pb-6 shadow-nav">
                  <div
                    className="grid grid-flow-col grid-rows-5 gap-x-3 gap-y-0"
                    aria-label={`${category.name} 소분류`}
                  >
                    <Link
                      href={toProductsHref(category.name)}
                      className={SUBCATEGORY_ITEM_CLASS}
                    >
                      전체상품
                    </Link>
                    {category.subcategories.map((sub) => (
                      <Link
                        key={sub.name}
                        href={toProductsHref(sub.name)}
                        className={SUBCATEGORY_ITEM_CLASS}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { CategoryMegaPanel, toProductsHref };
export type { CategoryMegaPanelProps };
