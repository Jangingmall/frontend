import type { Route } from "next";
import Link from "next/link";

import { ChevronRightIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import type { GnbCategory } from "@/lib/gnb-categories";
import { cn } from "@/lib/utils";

import { ErrorState } from "./error-state";

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
 * 그림자 `0 4px 12px rgba(0,0,0,.08)`(= `--shadow-nav`), 각 항목 버튼은 **고정 너비 132px**
 * (padding 24/24·12/12 포함, radius 2) — 텍스트 길이에 맞춰 칸마다 너비가 달라지면 안 되고
 * 전부 같은 너비라야 열 사이 12px 간격이 시각적으로도 일정하게 보인다(`w-33` = 33×4px =
 * 132px). 긴 라벨("컵 · 술병 · 술잔" 등)은 Figma 원본에서도 이 132px 박스보다 넓어 살짝
 * 넘치는데, 마침 다음 칸의 좌측 패딩(24px) 안으로 들어가서 옆 칸 텍스트와는 안 겹친다 —
 * 그대로 재현. 행 간격은 버튼 자체 패딩으로 만들어져 별도 gap이 없다. 활성 대분류 탭의
 * 배경은 `jade-blue-400`을 아주 낮은 투명도(Stateslayer fill 0.25 × layer opacity 0.3 = 7.5%)로
 * 얹은 옅은 틴트다 — 정확한 7.5%에 대응하는 semantic token이 없어(`docs/ui-system.md` §3.2)
 * 원시 토큰(`--jade-blue-400`)에 직접 불투명도를 실측값 그대로 지정한다.
 */
type CategoryMegaPanelStatus = "ready" | "loading" | "error";

interface CategoryMegaPanelProps {
  categories: GnbCategory[];
  /** 분류가 아직 없을 때(`categories`가 빈 배열) 보여줄 상태. 데이터가 있으면 무시된다. */
  status?: CategoryMegaPanelStatus;
  onRetry?: () => void;
  activeCategoryId: string;
  onActiveCategoryChange: (id: string) => void;
  className?: string;
}

/** 분류 ID(`category-{n}` · `subcategory-{n}`)로 상품 목록 링크를 만든다. */
function toProductsHref(categoryId: string): Route {
  return `/products?category=${encodeURIComponent(categoryId)}` as Route;
}

/**
 * 프로토타입 파일(`Interaction` 페이지) 명세 — 대분류 바 활성화: ease in · 위에서 아래로 · 800ms.
 * 내비 바 뒤(`-z-10`, 내비는 불투명 배경)에서 아래로 내려오는 슬라이드로 표현한다.
 */
const PANEL_MOTION_CLASS =
  "-z-10 animate-in duration-800 ease-in slide-in-from-top-full motion-reduce:animate-none";

/** 소분류 바 활성화: dissolve · 800ms. 각 항목 hover 색 변경: ease in · 600ms. */
const SUBCATEGORY_PANEL_MOTION_CLASS =
  "animate-in duration-800 ease-in fade-in motion-reduce:animate-none";

const SUBCATEGORY_ITEM_CLASS =
  "w-33 rounded-xs px-6 py-3 text-body-m whitespace-nowrap text-font-dark transition-colors duration-600 ease-in hover:bg-fill-neutral-weak";

function CategoryMegaPanel({
  categories,
  status = "ready",
  onRetry,
  activeCategoryId,
  onActiveCategoryChange,
  className,
}: CategoryMegaPanelProps) {
  // 분류를 받은 적이 없을 때만 대체 상태를 보여준다 — 이미 받은 데이터가 있으면 다시 조회가
  // 실패해도 그대로 유지한다(부모가 `categories`를 비우지 않는다).
  if (categories.length === 0) {
    return (
      <div
        data-slot="category-mega-panel"
        className={cn(
          "absolute top-full left-0 w-full bg-bg-default shadow-nav",
          PANEL_MOTION_CLASS,
          className,
        )}
      >
        {status === "error" ? (
          <ErrorState
            title="분류를 불러오지 못했습니다"
            description="잠시 후 다시 시도해 주세요."
            onRetry={onRetry}
            className="py-8"
          />
        ) : (
          <div
            role="status"
            aria-label="분류를 불러오는 중"
            className="flex gap-3 px-8 py-8"
          >
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-33" />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-slot="category-mega-panel"
      className={cn(
        "absolute top-full left-0 w-full",
        PANEL_MOTION_CLASS,
        className,
      )}
    >
      <div
        aria-label="대분류"
        className="flex bg-(--nav-menu-fill) px-6 lg:px-8"
      >
        {categories.map((category) => {
          const active = category.id === activeCategoryId;
          return (
            <div key={category.id} className="relative">
              <Link
                href={toProductsHref(category.id)}
                onMouseEnter={() => onActiveCategoryChange(category.id)}
                onFocus={() => onActiveCategoryChange(category.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1 px-3 py-3 text-body-m whitespace-nowrap text-font-white transition-colors duration-600 ease-in lg:px-6 [&_path]:fill-current",
                  active
                    ? "bg-(--jade-blue-400)/[0.075]"
                    : "hover:bg-states-hover-25",
                )}
              >
                {category.name}
                {active && <ChevronRightIcon className="size-4" />}
              </Link>
              {active && (
                <div
                  className={cn(
                    "absolute top-full left-0 w-fit bg-bg-default px-8 pt-4 pb-6 shadow-nav",
                    SUBCATEGORY_PANEL_MOTION_CLASS,
                  )}
                >
                  <div
                    className="grid grid-flow-col grid-rows-5 gap-x-3 gap-y-0"
                    aria-label={`${category.name} 소분류`}
                  >
                    <Link
                      href={toProductsHref(category.id)}
                      className={SUBCATEGORY_ITEM_CLASS}
                    >
                      전체상품
                    </Link>
                    {category.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        href={toProductsHref(sub.id)}
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
export type { CategoryMegaPanelProps, CategoryMegaPanelStatus };
