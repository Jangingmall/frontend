"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * `input-field.tsx`와 같은 스타일 계열(테두리·포커스·에러 색)의 멀티라인 입력. base-ui엔
 * Textarea primitive가 없어 네이티브 `<textarea>`를 그대로 쓴다. `maxLength`가 있으면 우측
 * 하단에 "N / 최대자" 글자수 카운터를 보여준다(취소·교환·환불 신청 모달의 "직접 입력"
 * 사유란 전용, `value`를 controlled로 넘길 때만 정확하다).
 */
interface TextareaProps extends Omit<ComponentProps<"textarea">, "className"> {
  label?: ReactNode;
  helperText?: ReactNode;
  /** 있으면 error 상태 + 이 메시지를 도움말 자리에 표시 */
  error?: string;
  /** 입력 박스(wrapper)에 적용 */
  className?: string;
  /** `<textarea>` 자체에 적용 */
  textareaClassName?: string;
}

function Textarea({
  label,
  helperText,
  error,
  className,
  textareaClassName,
  maxLength,
  value,
  disabled,
  id,
  ...props
}: TextareaProps) {
  const currentLength = typeof value === "string" ? value.length : 0;

  return (
    <div className={cn("flex flex-col", className)}>
      {label != null && (
        <label
          htmlFor={id}
          className={cn(
            "px-2 py-1 text-caption text-font-dark",
            error != null && "text-red-font",
          )}
        >
          {label}
        </label>
      )}

      <div
        className={cn(
          "flex flex-col border border-(--textfield-border) bg-bg-default px-2 py-2 transition-colors focus-within:border-(--textfield-border-selected)",
          error != null && "border-red-border",
          disabled && "opacity-60",
        )}
      >
        <textarea
          id={id}
          disabled={disabled}
          value={value}
          maxLength={maxLength}
          data-slot="textarea"
          className={cn(
            "min-h-24 w-full resize-none bg-transparent text-body-s text-font-dark caret-font-dark outline-none placeholder:text-(--textfield-font-weak) disabled:cursor-not-allowed",
            textareaClassName,
          )}
          {...props}
        />
        {maxLength != null && (
          <span className="self-end text-caption text-font-dark-weak">
            {currentLength} / {maxLength}자
          </span>
        )}
      </div>

      {error != null ? (
        <p role="alert" className="px-2 py-1 text-caption text-red-font">
          {error}
        </p>
      ) : helperText != null ? (
        <p className="px-2 py-1 text-caption text-font-dark-subtle">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export { Textarea };
export type { TextareaProps };
