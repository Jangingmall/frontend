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
 * `--nav-menu-fill`(컴포넌트 전용 nav 토큰, `docs/architecture.md`가 아니라 `globals.css`
 * "Component 색상" 절 — `bg-(--nav-menu-fill)`처럼 괄호 shorthand로 직접 소비)을 쓴다. 반면
 * 소분류 그리드가 든 흰 박스는 `w-fit`로 내용 너비만큼만 — Figma에서도 이 박스는 헤더 전체
 * 너비가 아니라 탭 바와 같은 왼쪽 정렬 좁은 박스다.
 *
 * 치수·색상은 Figma GUI 파일(`ZSESuanQor1IT8mr67JjmI`) `814:27100`(nav-bar-module 인스턴스)
 * 노드의 실측값을 그대로 옮겼다 — 패널(`nav-bar-group3`) 패딩 32/16/32/24, 열 간격 12,
 * 그림자 `0 4px 12px rgba(0,0,0,.08)`(= `--shadow-nav`), 각 항목 버튼 패딩 24/12·radius 2,
 * 행 간격은 버튼 자체 패딩으로 만들어져 별도 gap이 없다. 활성 대분류 탭의 배경은 흰색 블록이
 * 아니라 `jade-blue-400`을 아주 낮은 투명도(Stateslayer fill 0.25 × layer opacity 0.3 = 7.5%)로
 * 얹은 옅은 틴트다 — `--states-hover-25`(25%)는 3배 이상 진해서 육안으로도 Figma보다 뚜렷하게
 * 차이 났다. 정확한 7.5%에 대응하는 semantic token이 없어(`docs/ui-system.md` §3.2) 원시
 * 토큰(`--jade-blue-400`)에 직접 불투명도를 실측값 그대로 지정한다.
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

function CategoryMegaPanel({
  categories,
  activeCategoryName,
  onActiveCategoryChange,
  className,
}: CategoryMegaPanelProps) {
  const activeCategory =
    categories.find((category) => category.name === activeCategoryName) ??
    categories[0];

  return (
    <div
      data-slot="category-mega-panel"
      className={cn("absolute top-full left-0 w-full", className)}
    >
      <div aria-label="대분류" className="flex bg-(--nav-menu-fill) px-8">
        {categories.map((category) => {
          const active = category.name === activeCategory?.name;
          return (
            <Link
              key={category.name}
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
          );
        })}
      </div>
      {activeCategory && (
        <div className="w-fit bg-bg-default px-8 pt-4 pb-6 shadow-nav">
          <div
            className="grid grid-flow-col grid-rows-5 gap-x-3 gap-y-0"
            aria-label={`${activeCategory.name} 소분류`}
          >
            <Link
              href={toProductsHref(activeCategory.name)}
              className="rounded-xs px-6 py-3 text-body-m whitespace-nowrap text-font-dark transition-colors hover:bg-fill-neutral-weak"
            >
              전체상품
            </Link>
            {activeCategory.subcategories.map((sub) => (
              <Link
                key={sub.name}
                href={toProductsHref(sub.name)}
                className="rounded-xs px-6 py-3 text-body-m whitespace-nowrap text-font-dark transition-colors hover:bg-fill-neutral-weak"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { CategoryMegaPanel, toProductsHref };
export type { CategoryMegaPanelProps };
