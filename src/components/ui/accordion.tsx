"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import type { ComponentProps, ReactNode } from "react";

import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Figma Board-Row (`filter-mothercomponents` + `filter-descendant`). 항목을 접었다 펴는 리스트 —
 * 하위 내용을 페이지 이동 없이 확인할 때 사용.
 *   - `Accordion` 에 `title`/`onReset` → 상단 mother 헤더: `title-s`(15/600) + "초기화" +
 *     아래 1px `--border-neutral-solid` 굵은 구분선
 *   - `AccordionItem` (descendant): 트리거 행 [제목 ─ chevron], `p-2`
 *       - 접힘: `text-body-m`(14/400) + 아래 1px `--border-neutral-weak`, chevron ▾
 *       - 펼침: 볼드(700) + 구분선 없음, chevron ▴
 *
 * 주의:
 *   - Figma mother 헤더 우측의 chevron(그룹 전체 토글)은 생략. 필요하면 Collapsible 로 감싼다.
 *   - Figma 의 chevron 방향이 opened/closed 에서 뒤집혀 보여(접힘 ▴ / 펼침 ▾) 관습대로
 *     접힘 ▾ / 펼침 ▴ 로 구현했다(디자이너 확인 필요).
 */
interface AccordionProps extends Omit<
  ComponentProps<typeof AccordionPrimitive.Root>,
  "title" | "render"
> {
  /** 상단 mother 헤더 제목 */
  title?: ReactNode;
  onReset?: () => void;
}

function Accordion({
  title,
  onReset,
  className,
  children,
  ...props
}: AccordionProps) {
  return (
    <div className={cn("w-full", className)}>
      {title != null && (
        <div className="flex items-center justify-between gap-2 border-b border-border-neutral-solid pb-2">
          <span className="text-title-s text-font-dark">{title}</span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-xs px-2 py-1 text-caption text-font-dark-weak"
            >
              초기화
            </button>
          )}
        </div>
      )}
      <AccordionPrimitive.Root data-slot="accordion" {...props}>
        {children}
      </AccordionPrimitive.Root>
    </div>
  );
}

interface AccordionItemProps extends Omit<
  ComponentProps<typeof AccordionPrimitive.Item>,
  "children" | "title" | "render"
> {
  title: ReactNode;
  children?: ReactNode;
}

function AccordionItem({
  title,
  className,
  children,
  ...props
}: AccordionItemProps) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("w-full", className)}
      {...props}
    >
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger className="group/accordion-trigger flex w-full items-center justify-between gap-2 border-b border-border-neutral-weak p-2 text-body-m text-font-dark outline-none select-none data-panel-open:border-transparent data-panel-open:font-bold">
          {title}
          <ChevronDownIcon className="size-4 shrink-0 transition-transform group-data-panel-open/accordion-trigger:-rotate-180" />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Panel className="overflow-hidden text-body-m text-font-dark-subtle">
        <div className="p-2 pt-0">{children}</div>
      </AccordionPrimitive.Panel>
    </AccordionPrimitive.Item>
  );
}

export { Accordion, AccordionItem };
export type { AccordionProps, AccordionItemProps };
