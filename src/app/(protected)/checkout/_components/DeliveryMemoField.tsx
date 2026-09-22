"use client";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import type { CheckoutFormValues } from "@/app/(protected)/checkout/_lib/checkout-form-schema";
import { Select, SelectItem } from "@/components/ui/select";

import { CheckoutField } from "./CheckoutField";
export const DELIVERY_MEMOS = [
  "배송 전 연락 바랍니다.",
  "부재 시 경비실에 맡겨 주세요.",
  "부재 시 문 앞에 놓아 주세요.",
  "직접 받겠습니다.",
  "직접 입력",
];
export function DeliveryMemoField() {
  const { control } = useFormContext<CheckoutFormValues>();
  const memo = useWatch({ control, name: "memo" });
  return (
    <section className="space-y-3">
      <h3 className="text-body-s-b">배송 메모</h3>
      <Controller
        name="memo"
        control={control}
        render={({ field }) => (
          <Select
            value={field.value || null}
            onValueChange={(value) => field.onChange(value ?? "")}
            ariaLabel="배송 메모"
            alignItemWithTrigger={false}
            placeholder="배송 메모를 선택해 주세요."
          >
            {DELIVERY_MEMOS.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </Select>
        )}
      />
      {memo === "직접 입력" && (
        <CheckoutField
          name="memoText"
          label="배송메모 직접 입력"
          placeholder="배송메모 직접 입력"
        />
      )}
    </section>
  );
}
