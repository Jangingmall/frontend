"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import type { ReactNode } from "react";

import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components` 의 select-box(trigger) + select-box-module 1/2(옵션 패널)를 하나로
 * 통합. `@base-ui/react/select` 래핑.
 *   - trigger: h36, `rounded-xs`, 1px `--border-jade-fill`, 13px `--font-dark-subtle`, chevron
 *     열리면 180° 회전
 *   - 패널: `rounded-xs`, 1px `--border-neutral-weak`, `--fill-jade-weak` 배경, `shadow-nav`
 *   - 옵션 행: h36, 구분선 `--border-jade-weak`, highlight 시 `--states-hover` 오버레이
 *   - `SelectItem`의 `indicator` 로 Figma module 1(라디오형) / module 2(텍스트만) 전환
 */
interface SelectProps extends Omit<
  SelectPrimitive.Root.Props<string>,
  "children" | "render"
> {
  placeholder?: ReactNode;
  /** trigger 에 적용 */
  className?: string;
  /** 팝업에 적용 */
  contentClassName?: string;
  children: ReactNode;
}

function Select({
  placeholder = "항목을 선택해주세요",
  className,
  contentClassName,
  children,
  ...props
}: SelectProps) {
  return (
    <SelectPrimitive.Root {...props}>
      <SelectPrimitive.Trigger
        data-slot="select-trigger"
        className={cn(
          "group/select-trigger flex h-9 w-full items-center justify-between gap-2 rounded-xs border border-border-jade-fill bg-bg-default px-2 text-body-s text-font-dark-subtle outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill data-disabled:cursor-not-allowed data-disabled:opacity-60",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="flex shrink-0 text-font-dark transition-transform group-aria-expanded/select-trigger:rotate-180">
          <ChevronDownIcon className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          sideOffset={-1}
          className="z-50 outline-none"
        >
          <SelectPrimitive.Popup
            data-slot="select-popup"
            className={cn(
              "max-h-(--available-height) w-(--anchor-width) overflow-y-auto overscroll-contain rounded-xs border border-border-neutral-weak bg-fill-jade-weak shadow-nav outline-none",
              contentClassName,
            )}
          >
            {children}
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

interface SelectItemProps extends Omit<
  SelectPrimitive.Item.Props,
  "children" | "render"
> {
  /** true 면 왼쪽에 라디오형 인디케이터(Figma module 1), false 면 텍스트만(module 2) */
  indicator?: boolean;
  children: ReactNode;
}

function SelectItem({
  indicator = false,
  className,
  children,
  ...props
}: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "flex h-9 cursor-default items-center gap-2 px-2 text-body-s text-font-dark-subtle outline-none select-none not-last:border-b not-last:border-border-jade-weak data-highlighted:bg-states-hover data-disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {indicator && (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-jade-fill">
          <SelectPrimitive.ItemIndicator className="flex">
            <span className="size-2 rounded-full bg-border-jade-fill" />
          </SelectPrimitive.ItemIndicator>
        </span>
      )}
      <SelectPrimitive.ItemText className="truncate">
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectItem };
export type { SelectProps, SelectItemProps };
