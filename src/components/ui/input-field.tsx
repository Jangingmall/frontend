"use client";

import { Field } from "@base-ui/react/field";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { useRef, useState } from "react";
import type { ReactNode } from "react";

import { CancelIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { setNativeInputValue } from "@/lib/dom";
import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / input-field` set. States(default/selected/typing/filled/error +
 * masked 쌍)는 대부분 런타임 상태라 prop 으로 두지 않고 `:focus-within` / `error` prop /
 * `type="password"` 로 처리한다.
 *   - masked / masked 쌍  → `type="password"` (표시 토글 아이콘 자동 노출)
 *   - typing 상태의 clear 아이콘 → `clearable`
 *   - label 1(위) → `label`, label 2(아래 도움말) → `helperText`, error 시 `error` 로 대체
 *
 * 색: 테두리 default `--textfield-border`(cool-grey-900 10%) / focus `--textfield-border-selected`
 * (jade-blue-700) / error `--red-border`. placeholder `--textfield-font-weak`(cool-grey-500).
 * 입력 박스 radius 0, 높이 44(`h-11`), 라벨·도움말 `text-caption`(10px). Figma 에 disabled
 * variant 는 없어서 opacity 로 임의 처리(디자이너 확인 필요).
 */
interface InputFieldProps extends Omit<InputPrimitive.Props, "className"> {
  label?: ReactNode;
  helperText?: ReactNode;
  /** 있으면 error 상태 + 이 메시지를 도움말 자리에 표시 */
  error?: string;
  /** 값이 있을 때 우측에 지우기(X) 버튼 노출 */
  clearable?: boolean;
  /** 입력 박스(wrapper)에 적용 */
  className?: string;
  /** `<input>` 자체에 적용 */
  inputClassName?: string;
}

function InputField({
  label,
  helperText,
  error,
  clearable = false,
  className,
  inputClassName,
  type = "text",
  value,
  defaultValue,
  onValueChange,
  disabled,
  ...props
}: InputFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [hasValue, setHasValue] = useState(
    () => String(value ?? defaultValue ?? "").length > 0,
  );

  const isPassword = type === "password";
  const resolvedType = isPassword && revealed ? "text" : type;

  const handleValueChange: NonNullable<
    InputPrimitive.Props["onValueChange"]
  > = (next, details) => {
    setHasValue(next.length > 0);
    onValueChange?.(next, details);
  };

  const clear = () => {
    if (inputRef.current) {
      setNativeInputValue(inputRef.current, "");
      inputRef.current.focus();
    }
  };

  return (
    <Field.Root
      className="group/field flex flex-col"
      data-invalid={error != null ? "" : undefined}
      disabled={disabled}
    >
      {label != null && (
        <Field.Label className="px-2 py-1 text-caption text-font-dark group-data-invalid/field:text-red-font">
          {label}
        </Field.Label>
      )}

      <div
        className={cn(
          "flex h-11 items-center gap-2 border border-(--textfield-border) bg-bg-default px-2 transition-colors group-data-invalid/field:border-red-border focus-within:border-(--textfield-border-selected)",
          disabled && "opacity-60",
          className,
        )}
      >
        <InputPrimitive
          ref={inputRef}
          type={resolvedType}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onValueChange={handleValueChange}
          data-slot="input-field"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-body-s text-font-dark caret-font-dark outline-none placeholder:text-(--textfield-font-weak) disabled:cursor-not-allowed",
            inputClassName,
          )}
          {...props}
        />

        {clearable && hasValue && !disabled && (
          <button
            type="button"
            onClick={clear}
            aria-label="입력 지우기"
            className="flex size-7 shrink-0 items-center justify-center text-font-dark"
          >
            <CancelIcon className="size-6" />
          </button>
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((prev) => !prev)}
            aria-label={revealed ? "비밀번호 숨기기" : "비밀번호 표시"}
            aria-pressed={revealed}
            className="flex size-7 shrink-0 items-center justify-center text-font-dark"
          >
            {revealed ? (
              <EyeOffIcon className="size-6" />
            ) : (
              <EyeIcon className="size-6" />
            )}
          </button>
        )}
      </div>

      {error != null ? (
        <Field.Error match className="px-2 py-1 text-caption text-red-font">
          {error}
        </Field.Error>
      ) : helperText != null ? (
        <Field.Description className="px-2 py-1 text-caption text-font-dark-subtle">
          {helperText}
        </Field.Description>
      ) : null}
    </Field.Root>
  );
}

export { InputField };
export type { InputFieldProps };
