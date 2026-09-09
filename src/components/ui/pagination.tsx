import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EndPointIcon,
  StartPointIcon,
} from "./icons";

/**
 * Figma `[FE] Components / Selecter` 의 `selecter` set → `Type=pagenation` (36×36, `rounded-xs`,
 * `text-title-m` 17/600).
 *   - default: `--fill-jade-weak` 배경 + `--border-neutral-subtle` 테두리 + `--font-dark`
 *   - selected(`aria-current="page"`): `--fill-neutral-impact` 배경 + `--font-white`
 *
 * 구조(2026-09-09 수정): 생략(…) 없이 **항상 페이지 번호 5개**를 보여준다.
 *   - `pageCount <= 5`: 1..pageCount 만, 화살표 버튼 없음
 *   - `pageCount > 5`: 5칸 창(가능하면 현재 페이지가 가운데) + 화살표 4개
 *     (start-point → 첫 페이지 / chevron-left → 이전 / chevron-right → 다음 / end-point → 끝)
 */
const PAGE_WINDOW = 5;

const paginationButtonVariants = cva(
  "inline-flex size-9 shrink-0 items-center justify-center rounded-xs border border-border-neutral-subtle bg-fill-jade-weak text-title-m text-font-dark transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill disabled:cursor-not-allowed disabled:opacity-40 aria-[current=page]:bg-fill-neutral-impact aria-[current=page]:text-font-white [&_path]:fill-current [&_svg]:size-4",
);

interface PaginationProps extends Omit<ComponentProps<"nav">, "onChange"> {
  /** 현재 페이지 (1-indexed) */
  page: number;
  /** 전체 페이지 수 */
  pageCount: number;
  onPageChange: (page: number) => void;
}

function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
  ...props
}: PaginationProps) {
  const pages = getPageWindow(page, pageCount);
  const showArrows = pageCount > PAGE_WINDOW;

  const go = (next: number) => {
    if (next >= 1 && next <= pageCount && next !== page) onPageChange(next);
  };

  return (
    <nav
      aria-label="페이지 이동"
      data-slot="pagination"
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      {showArrows && (
        <>
          <button
            type="button"
            aria-label="첫 페이지"
            disabled={page <= 1}
            onClick={() => go(1)}
            className={cn(paginationButtonVariants())}
          >
            <StartPointIcon />
          </button>
          <button
            type="button"
            aria-label="이전 페이지"
            disabled={page <= 1}
            onClick={() => go(page - 1)}
            className={cn(paginationButtonVariants())}
          >
            <ChevronLeftIcon />
          </button>
        </>
      )}

      {pages.map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} 페이지`}
          aria-current={n === page ? "page" : undefined}
          onClick={() => go(n)}
          className={cn(paginationButtonVariants())}
        >
          {n}
        </button>
      ))}

      {showArrows && (
        <>
          <button
            type="button"
            aria-label="다음 페이지"
            disabled={page >= pageCount}
            onClick={() => go(page + 1)}
            className={cn(paginationButtonVariants())}
          >
            <ChevronRightIcon />
          </button>
          <button
            type="button"
            aria-label="끝 페이지"
            disabled={page >= pageCount}
            onClick={() => go(pageCount)}
            className={cn(paginationButtonVariants())}
          >
            <EndPointIcon />
          </button>
        </>
      )}
    </nav>
  );
}

/**
 * 항상 최대 5개의 연속된 페이지 번호. `pageCount <= 5` 면 1..pageCount, 그 이상이면 현재
 * 페이지를 가운데 두되 양끝에서는 창을 안쪽으로 클램프한다.
 */
function getPageWindow(page: number, pageCount: number): number[] {
  if (pageCount <= 0) return [];
  const size = Math.min(PAGE_WINDOW, pageCount);
  const current = Math.min(Math.max(page, 1), pageCount);
  const start = Math.min(
    Math.max(current - Math.floor(size / 2), 1),
    pageCount - size + 1,
  );
  return Array.from({ length: size }, (_, i) => start + i);
}

export { getPageWindow, Pagination, paginationButtonVariants };
export type { PaginationProps };
