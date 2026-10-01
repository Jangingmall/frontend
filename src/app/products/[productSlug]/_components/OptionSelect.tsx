"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface OptionSelectItem {
  value: string;
  label: string;
  disabled?: boolean;
}

interface OptionSelectProps {
  ariaLabel: string;
  placeholder: ReactNode;
  items: OptionSelectItem[];
  value: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  /** 트리거에 적용 */
  className?: string;
}

function firstEnabledIndex(
  items: OptionSelectItem[],
  from: number,
  step: 1 | -1,
) {
  for (let index = from; index >= 0 && index < items.length; index += step) {
    if (!items[index].disabled) return index;
  }
  return -1;
}

function initialActiveIndex(items: OptionSelectItem[], value: string | null) {
  const selected = items.findIndex(
    (item) => item.value === value && !item.disabled,
  );
  return selected >= 0 ? selected : firstEnabledIndex(items, 0, 1);
}

/**
 * 구매 패널 옵션 선택. 공통 `Select`는 목록이 Portal 팝업으로 떠서 아래 옵션을 덮는다 — 시안은
 * 목록이 열리면 같은 흐름 안에서 펼쳐지며 다음 옵션을 아래로 밀어내므로, 목록을 트리거 바로
 * 아래에 인라인으로 그린다. 열림 상태는 부모가 소유한다(선택하면 다음 옵션을 이어서 여는
 * 흐름 때문).
 *
 * 접근성은 select-only combobox 패턴이다 — 포커스는 항상 트리거에 있고 `aria-activedescendant`
 * 로 활성 항목을 알린다. 방향키·Home·End로 이동, Enter·Space로 선택, Esc·Tab으로 닫는다.
 */
export function OptionSelect({
  ariaLabel,
  placeholder,
  items,
  value,
  open,
  onOpenChange,
  onValueChange,
  disabled,
  className,
}: OptionSelectProps) {
  const id = useId();
  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-option-${index}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [wasOpen, setWasOpen] = useState(open);
  const selected = items.find((item) => item.value === value);

  // 열림이 바뀔 때마다 활성 항목을 다시 잡는다(렌더 중 상태 조정 패턴).
  if (wasOpen !== open) {
    setWasOpen(open);
    setActiveIndex(open ? initialActiveIndex(items, value) : -1);
  }

  // 선택 직후 다음 옵션이 부모에 의해 열리면 키보드 흐름이 이어지도록 그 트리거로 포커스를 옮긴다.
  useEffect(() => {
    if (open && document.activeElement !== triggerRef.current) {
      triggerRef.current?.focus();
    }
  }, [open]);

  // 바깥을 누르면 닫는다(팝업의 바깥 클릭 닫힘과 같은 동작).
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onOpenChange]);

  function select(index: number) {
    const item = items[index];
    if (!item || item.disabled) return;
    onValueChange(item.value);
  }

  function move(step: 1 | -1) {
    const next = firstEnabledIndex(items, activeIndex + step, step);
    if (next >= 0) setActiveIndex(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        if (!open) onOpenChange(true);
        else move(event.key === "ArrowDown" ? 1 : -1);
        break;
      case "Home":
      case "End":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(
          event.key === "Home"
            ? firstEnabledIndex(items, 0, 1)
            : firstEnabledIndex(items, items.length - 1, -1),
        );
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) onOpenChange(true);
        else if (activeIndex >= 0) select(activeIndex);
        break;
      case "Escape":
        if (!open) return;
        event.preventDefault();
        onOpenChange(false);
        break;
      case "Tab":
        if (open) onOpenChange(false);
        break;
    }
  }

  return (
    <div ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-xs border border-border-jade-fill bg-bg-default px-2 text-body-s text-font-dark-subtle outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDownIcon
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-font-dark transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="max-h-72 overflow-y-auto overscroll-contain rounded-xs border border-t-0 border-border-neutral-weak bg-fill-jade-weak"
        >
          {items.map((item, index) => (
            <li
              key={item.value}
              id={optionId(index)}
              role="option"
              aria-selected={item.value === value}
              aria-disabled={item.disabled || undefined}
              // 트리거의 포커스를 유지한 채 항목을 누르게 한다.
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => !item.disabled && setActiveIndex(index)}
              onClick={() => select(index)}
              className={cn(
                "flex h-9 cursor-default items-center px-2 text-body-s text-font-dark-subtle select-none not-last:border-b not-last:border-border-jade-weak aria-disabled:opacity-60",
                index === activeIndex && "bg-states-hover",
                item.value === value && "font-bold",
              )}
            >
              <span className="truncate">{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type { OptionSelectItem, OptionSelectProps };
