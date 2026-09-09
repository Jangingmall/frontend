"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import type { Ref } from "react";
import { useRef, useState } from "react";

import { setNativeInputValue } from "@/lib/dom";
import { useMergeRefs } from "@/lib/merge-refs";
import { cn } from "@/lib/utils";

import { CancelIcon, SearchIcon } from "./icons";

/**
 * Figma `[FE] Components / search-field` set. 하단 밑줄만 있는 검색 입력 + 우측 돋보기.
 * States(default/selected/typing)는 전부 런타임이라 prop 없음 — 밑줄 색은 3상태 모두
 * `--textfield-border-selected`(jade-blue-700)로 동일. Enter 또는 돋보기 클릭 시 `onSearch`.
 * 값이 있으면 clear(X) 버튼 노출. 텍스트 `text-body-l`(16px). label·error 없음.
 *
 * 주의: `CancelIcon` 자산은 색이 하드코딩(#121b29)이라 Figma 의 옅은 clear 아이콘(#8e9a9c)
 * 색은 반영되지 않는다(아이콘 currentColor 전환은 별도 작업).
 */
interface SearchFieldProps extends Omit<
  InputPrimitive.Props,
  "type" | "className"
> {
  /** base-ui `Input.Props` 는 ref 를 omit 하므로 명시. 내부 ref 와 합쳐 `<input>` 에 연결된다. */
  ref?: Ref<HTMLInputElement>;
  /** Enter 또는 돋보기 클릭 시 현재 값으로 호출 */
  onSearch?: (value: string) => void;
  /** 값이 있을 때 clear(X) 버튼 노출 (기본 true) */
  clearable?: boolean;
  className?: string;
  inputClassName?: string;
}

function SearchField({
  ref,
  onSearch,
  clearable = true,
  className,
  inputClassName,
  value,
  defaultValue,
  onValueChange,
  onKeyDown,
  disabled,
  ...props
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergeRefs(inputRef, ref);
  // controlled 면 `value` 에서 직접 파생(외부에서 바뀌어도 정확). uncontrolled 면 state 로 추적.
  const [uncontrolledHasValue, setUncontrolledHasValue] = useState(
    () => String(defaultValue ?? "").length > 0,
  );
  const hasValue =
    value !== undefined ? String(value).length > 0 : uncontrolledHasValue;

  const handleValueChange: NonNullable<
    InputPrimitive.Props["onValueChange"]
  > = (next, details) => {
    setUncontrolledHasValue(next.length > 0);
    onValueChange?.(next, details);
  };

  const search = () => onSearch?.(inputRef.current?.value ?? "");

  const clear = () => {
    if (inputRef.current) {
      setNativeInputValue(inputRef.current, "");
      inputRef.current.focus();
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-(--textfield-border-selected) py-2",
        disabled && "opacity-60",
        className,
      )}
    >
      <InputPrimitive
        ref={mergedRef}
        type="search"
        disabled={disabled}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented && event.key === "Enter") {
            search();
          }
        }}
        data-slot="search-field"
        className={cn(
          "min-w-0 flex-1 bg-transparent text-body-l text-font-dark caret-font-dark outline-none placeholder:text-(--textfield-font-weak) [&::-webkit-search-cancel-button]:hidden",
          inputClassName,
        )}
        {...props}
      />

      {clearable && hasValue && !disabled && (
        <button
          type="button"
          onClick={clear}
          aria-label="검색어 지우기"
          className="flex size-6 shrink-0 items-center justify-center text-(--textfield-border-selected)"
        >
          <CancelIcon className="size-5" />
        </button>
      )}

      <button
        type="button"
        onClick={search}
        disabled={disabled}
        aria-label="검색"
        className="flex size-8 shrink-0 items-center justify-center text-font-dark"
      >
        <SearchIcon className="size-6" />
      </button>
    </div>
  );
}

export { SearchField };
export type { SearchFieldProps };
