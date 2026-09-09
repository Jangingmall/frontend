import type { ReactNode } from "react";
import { Children, isValidElement } from "react";

import { cn } from "@/lib/utils";

import { ChevronRightIcon } from "./icons";

/**
 * Figma `[FE] Components / bread crumb` set. 경로 표시.
 *   - step1(첫 항목): `[번호][라벨]`, gap 4, `text-body-s`(13/400) 다크
 *   - step2-(이후 항목): 앞에 `>` chevron(16px) 추가
 * 첫 항목 여부는 `Breadcrumb` 이 자식 순서로 판단해 chevron 을 넣는다.
 */
function Breadcrumb({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <nav aria-label="breadcrumb">
      <ol className={cn("flex items-center gap-1", className)}>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRightIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-font-dark"
              />
            )}
            {item}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface BreadcrumbItemProps {
  /** 앞에 붙는 단계 번호(예: "01") */
  index?: ReactNode;
  href?: string;
  /** 현재 위치(마지막 항목) — `aria-current="page"` */
  current?: boolean;
  children: ReactNode;
  className?: string;
}

function BreadcrumbItem({
  index,
  href,
  current,
  children,
  className,
}: BreadcrumbItemProps) {
  const content = (
    <span
      className={cn(
        "flex items-center gap-1 text-body-s text-font-dark",
        className,
      )}
    >
      {index != null && <span>{index}</span>}
      <span>{children}</span>
    </span>
  );

  if (href != null) {
    return (
      <a href={href} aria-current={current ? "page" : undefined}>
        {content}
      </a>
    );
  }
  return <span aria-current={current ? "page" : undefined}>{content}</span>;
}

export { Breadcrumb, BreadcrumbItem };
export type { BreadcrumbItemProps };
