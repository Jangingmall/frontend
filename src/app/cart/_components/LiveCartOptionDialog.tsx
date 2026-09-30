"use client";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { CartLine } from "@/types/cart";

interface LiveCartOptionDialogProps {
  line: CartLine;
  pending: boolean;
  error: string;
  onClose: () => void;
  onPreview?: () => void;
  onApply: (quantity: number, textInputs: CartLine["textInputs"]) => void;
}

export function LiveCartOptionDialog({
  line,
  pending,
  error,
  onClose,
  onPreview,
  onApply,
}: LiveCartOptionDialogProps) {
  const [quantity, setQuantity] = useState(String(line.quantity));
  const [textInputs, setTextInputs] = useState(line.textInputs);
  const validQuantity =
    Number.isSafeInteger(Number(quantity)) && Number(quantity) > 0;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
      title="상품 옵션 변경"
      variant="form"
      footer={
        <div className="flex gap-2.5">
          <Button variant="outline" disabled={pending} onClick={onClose}>
            취소
          </Button>
          <Button
            disabled={pending || !validQuantity}
            onClick={() => onApply(Number(quantity), textInputs)}
          >
            {pending ? "변경 중" : "변경하기"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-body-m">{line.productName}</p>
        <p role="status" className="text-body-s text-font-dark-weak">
          수량과 입력한 옵션 내용을 변경할 수 있습니다. 선택형 옵션은 현재
          선택이 유지됩니다.
        </p>
        {line.options.map((option, index) => (
          <p key={index} className="text-body-s">
            {option}
          </p>
        ))}
        <label className="flex flex-col gap-2 text-body-s">
          수량
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            disabled={pending}
            onChange={(event) => setQuantity(event.target.value)}
            className="rounded-xs border border-border-jade-weak p-3"
          />
        </label>
        {textInputs.map((input, index) => (
          <label
            key={input.optionGroupId}
            className="flex flex-col gap-2 text-body-s"
          >
            {input.name ?? `입력 옵션 ${index + 1}`}
            <input
              value={input.text}
              disabled={pending}
              onChange={(event) =>
                setTextInputs((current) =>
                  current.map((value, i) =>
                    i === index
                      ? { ...value, text: event.target.value }
                      : value,
                  ),
                )
              }
              className="rounded-xs border border-border-jade-weak p-3"
            />
          </label>
        ))}
        {onPreview && (
          <div className="space-y-2">
            <p className="text-body-s">
              선택형 옵션 변경은 별도 시연 장바구니에서 확인할 수 있습니다. 실제
              장바구니에는 반영되지 않습니다.
            </p>
            <Button variant="outline" disabled={pending} onClick={onPreview}>
              선택형 옵션 변경 시연
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-body-s">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
