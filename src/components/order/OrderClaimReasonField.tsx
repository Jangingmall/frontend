"use client";

import { Select, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const FREE_TEXT_OPTION = "직접 입력";
const FREE_TEXT_MAX_LENGTH = 2000;

export interface OrderClaimReasonValue {
  /** 고른 옵션 문구 그대로. */
  label: string;
  /** "직접 입력"을 골랐을 때만 입력한 자유 텍스트. */
  freeText?: string;
}

interface OrderClaimReasonFieldProps {
  /** 마지막 항목이 "직접 입력"이라고 가정한다. */
  options: readonly string[];
  value: OrderClaimReasonValue;
  onChange: (value: OrderClaimReasonValue) => void;
  ariaLabel: string;
  /** "직접 입력" textarea의 placeholder. */
  freeTextPlaceholder: string;
  error?: string;
}

/**
 * 취소·교환·환불 신청 모달(MY-request·MY-exchange)이 공유하는 사유 필드 — select +
 * "직접 입력" 선택 시에만 나오는 textarea. 두 모달이 출력값을 다르게 조합한다: 취소 모달은
 * `freeText ?? label` 하나로 합치고, 교환·환불 모달은 `label`을 `reasonLabel`에, `freeText`를
 * `description`에 그대로 나눠 넣는다(`OrderCancelRequestModal`·`OrderExchangeRefundRequestModal`).
 */
export function OrderClaimReasonField({
  options,
  value,
  onChange,
  ariaLabel,
  freeTextPlaceholder,
  error,
}: OrderClaimReasonFieldProps) {
  const isFreeText = value.label === FREE_TEXT_OPTION;

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={value.label || undefined}
        onValueChange={(label: string | null) =>
          onChange({
            label: label ?? "",
            freeText: label === FREE_TEXT_OPTION ? "" : undefined,
          })
        }
        ariaLabel={ariaLabel}
        placeholder="사유를 선택해주세요."
      >
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </Select>

      {isFreeText && (
        <Textarea
          aria-label={`${ariaLabel} 직접 입력`}
          placeholder={freeTextPlaceholder}
          maxLength={FREE_TEXT_MAX_LENGTH}
          value={value.freeText ?? ""}
          onChange={(event) =>
            onChange({ label: value.label, freeText: event.target.value })
          }
        />
      )}

      {error != null && (
        <p role="alert" className="px-2 py-1 text-caption text-red-font">
          {error}
        </p>
      )}
    </div>
  );
}
