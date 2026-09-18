"use client";
import { useRef, useState } from "react";

import type { CartOptionDefinition } from "@/app/cart/_lib/cart-fixtures";
import {
  isOptionComplete,
  updateOptionDraft,
} from "@/app/cart/_lib/cart-options";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select, SelectItem } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
export interface CartOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definitions: CartOptionDefinition[];
  initialValues: string[];
  onApply: (values: string[]) => void;
  initialError?: boolean;
  initialOpenIndex?: number;
}
export function CartOptionDialog({
  open,
  onOpenChange,
  definitions,
  initialValues,
  onApply,
  initialError = false,
  initialOpenIndex = -1,
}: CartOptionDialogProps) {
  const visible = definitions
    .filter((item) => !item.gift)
    .slice(0, 3)
    .concat(definitions.filter((item) => item.gift).slice(0, 1));
  const [draft, setDraft] = useState(initialValues);
  const [openIndex, setOpenIndex] = useState(initialOpenIndex);
  const [error, setError] = useState(initialError);
  const container = useRef<HTMLDivElement>(null);
  function apply(values: string[]) {
    onApply(values);
    onOpenChange(false);
  }
  function select(index: number, value: string | null) {
    if (value === null) return;
    const wasComplete = isOptionComplete(draft, visible);
    const next = updateOptionDraft(draft, index, value, visible);
    setDraft(next);
    setError(false);
    if (wasComplete && isOptionComplete(next, visible)) {
      apply(next);
      return;
    }
    const missing = visible.findIndex((_, i) => !next[i]);
    setOpenIndex(missing > index ? missing : -1);
  }
  function submit() {
    if (isOptionComplete(draft, visible)) {
      apply(draft);
      return;
    }
    setError(true);
    const missing = visible.findIndex(
      (definition, index) =>
        !(definition.available?.(draft) ?? definition.values).includes(
          draft[index],
        ),
    );
    container.current
      ?.querySelectorAll<HTMLButtonElement>('[data-slot="select-trigger"]')
      [missing]?.focus();
  }
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      variant="form"
      title="상품 옵션 변경"
      footer={
        <div className="flex gap-2.5">
          <Button
            variant="jade"
            size="xl"
            className="w-1/3 max-w-40"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button size="xl" className="flex-1" onClick={submit}>
            변경하기
          </Button>
        </div>
      }
    >
      <div ref={container} className="flex min-h-full flex-col">
        <p className="mb-2 text-body-s-b">
          선택 ({visible.filter((_, index) => !!draft[index]).length}/
          {visible.length})
        </p>
        <div className="flex flex-col gap-1">
          {visible.map((definition, index) => (
            <Select
              key={definition.label}
              ariaLabel={definition.label}
              placeholder={`${index + 1}. ${definition.label}`}
              value={draft[index] || null}
              onValueChange={(value) => select(index, value)}
              disabled={index > 0 && !draft[index - 1]}
              open={openIndex === index}
              onOpenChange={(isOpen) =>
                setOpenIndex((previous) =>
                  isOpen ? index : previous === index ? -1 : previous,
                )
              }
              className={cn(
                draft[index] && "font-bold",
                error && !draft[index] && "border-red-border",
              )}
            >
              <SelectItem value="" disabled>
                항목을 선택해주세요
              </SelectItem>
              {(definition.available?.(draft) ?? definition.values).map(
                (value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ),
              )}
            </Select>
          ))}
        </div>
        {error && (
          <Toast className="mt-auto w-full shrink-0">
            옵션을 선택하지 않았습니다
          </Toast>
        )}
      </div>
    </Dialog>
  );
}
