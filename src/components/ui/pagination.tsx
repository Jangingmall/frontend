import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / Selecter` 의 `selecter` set → `Type=pagenation` (36×36, `rounded-xs`,
 * `text-title-m` 17/600).
 *   - default: `--fill-jade-weak` 배경 + `--border-neutral-subtle` 테두리 + `--font-dark`
 *   - selected(`aria-current="page"`): `--fill-neutral-impact` 배경 + `--font-white`
 * 이전/다음 버튼과 생략(…)은 Figma 미정의 — 번호 버튼과 같은 스타일 + chevron 아이콘으로 구성.
 */
const paginationButtonVariants = cva(
  "inline-flex size-9 shrink-0 items-center justify-center rounded-xs border border-border-neutral-subtle bg-fill-jade-weak text-title-m text-font-dark transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill disabled:cursor-not-allowed disabled:opacity-40 aria-[current=page]:bg-fill-neutral-impact aria-[current=page]:text-font-white [&_svg]:size-4",
);

interface PaginationProps extends Omit<ComponentProps<"nav">, "onChange"> {
  /** 현재 페이지 (1-indexed) */
  page: number;
  /** 전체 페이지 수 */
  pageCount: number;
  onPageChange: (page: number) => void;
  /** 현재 페이지 양옆에 항상 보일 번호 수 (기본 1) */
  siblingCount?: number;
  /** 처음/끝에 항상 보일 번호 수 (기본 1) */
  boundaryCount?: number;
}

function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  className,
  ...props
}: PaginationProps) {
  const items = getPaginationRange(
    page,
    pageCount,
    siblingCount,
    boundaryCount,
  );

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
      <button
        type="button"
        aria-label="이전 페이지"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className={cn(paginationButtonVariants())}
      >
        <ChevronLeftIcon />
      </button>

      {items.map((item, i) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            aria-label={`${item} 페이지`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => go(item)}
            className={cn(paginationButtonVariants())}
          >
            {item}
          </button>
        ) : (
          <span
            key={`ellipsis-${i}`}
            aria-hidden="true"
            className="inline-flex size-9 shrink-0 items-center justify-center text-title-m text-font-dark-subtle"
          >
            …
          </span>
        ),
      )}

      <button
        type="button"
        aria-label="다음 페이지"
        disabled={page >= pageCount}
        onClick={() => go(page + 1)}
        className={cn(paginationButtonVariants())}
      >
        <ChevronRightIcon />
      </button>
    </nav>
  );
}

/**
 * `[1, "ellipsis", 4, 5, 6, "ellipsis", 20]` 형태의 표시 목록을 만든다.
 * MUI `usePagination` 의 items 계산과 동일한 규칙: 양끝 `boundaryCount` 개 + 현재 페이지
 * 양옆 `siblingCount` 개를 항상 보여주고, 그 사이가 2칸 이상 벌어지면 생략(…), 딱 1칸이면
 * 그 번호를 그대로 노출한다.
 */
function getPaginationRange(
  page: number,
  pageCount: number,
  siblingCount: number,
  boundaryCount: number,
): Array<number | "ellipsis"> {
  if (pageCount <= 0) return [];
  const range = (start: number, end: number) =>
    end >= start
      ? Array.from({ length: end - start + 1 }, (_, i) => start + i)
      : [];

  const current = Math.min(Math.max(page, 1), pageCount);
  const startPages = range(1, Math.min(boundaryCount, pageCount));
  const endPages = range(
    Math.max(pageCount - boundaryCount + 1, boundaryCount + 1),
    pageCount,
  );

  const siblingsStart = Math.max(
    Math.min(
      current - siblingCount,
      pageCount - boundaryCount - siblingCount * 2 - 1,
    ),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(current + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : pageCount - 1,
  );

  return [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2
      ? (["ellipsis"] as const)
      : boundaryCount + 1 < pageCount - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < pageCount - boundaryCount - 1
      ? (["ellipsis"] as const)
      : pageCount - boundaryCount > boundaryCount
        ? [pageCount - boundaryCount]
        : []),
    ...endPages,
  ];
}

export { Pagination, paginationButtonVariants, getPaginationRange };
export type { PaginationProps };
