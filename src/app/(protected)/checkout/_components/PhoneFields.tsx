"use client";
import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import type { CheckoutFormValues } from "@/app/(protected)/checkout/_lib/checkout-form-schema";
import { Select, SelectItem } from "@/components/ui/select";
import { PHONE_PREFIXES } from "@/constants/phone";

import { CheckoutField } from "./CheckoutField";
export function PhoneFields({
  owner,
  readOnly = false,
}: {
  owner: "customer" | "recipient";
  readOnly?: boolean;
}) {
  const { control } = useFormContext<CheckoutFormValues>();
  const currentPrefix = useWatch({ control, name: `${owner}PhoneFirst` });
  const [direct, setDirect] = useState(false);
  const label = owner === "customer" ? "주문자" : "수령인";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
      {readOnly ? (
        <CheckoutField
          name={`${owner}PhoneFirst`}
          label={`${label} 휴대전화 앞자리`}
          type="tel"
          readOnly
        />
      ) : (
        <div className="min-w-0 space-y-2">
          <Controller
            control={control}
            name={`${owner}PhoneFirst`}
            render={({ field }) => (
              <Select
                ariaLabel={`${label} 휴대전화 앞자리`}
                value={
                  direct ||
                  (!!field.value &&
                    !PHONE_PREFIXES.some((prefix) => prefix === field.value))
                    ? "direct"
                    : field.value || null
                }
                items={[
                  ...PHONE_PREFIXES.map((prefix) => ({
                    value: prefix,
                    label: prefix,
                  })),
                  { value: "direct", label: "직접 입력" },
                ]}
                onValueChange={(value) => {
                  setDirect(value === "direct");
                  field.onChange(value === "direct" ? "" : (value ?? ""));
                }}
              >
                {PHONE_PREFIXES.map((prefix) => (
                  <SelectItem key={prefix} value={prefix}>
                    {prefix}
                  </SelectItem>
                ))}
                <SelectItem value="direct">직접 입력</SelectItem>
              </Select>
            )}
          />
          {(direct ||
            (!!currentPrefix &&
              !PHONE_PREFIXES.some((prefix) => prefix === currentPrefix))) && (
            <CheckoutField
              name={`${owner}PhoneFirst`}
              label={`${label} 휴대전화 앞자리 직접 입력`}
              type="tel"
            />
          )}
        </div>
      )}
      <span className="pt-2">-</span>
      <CheckoutField
        name={`${owner}PhoneMiddle`}
        label={`${label} 휴대전화 중간자리`}
        placeholder="0000"
        type="tel"
        readOnly={readOnly}
      />
      <span className="pt-2">-</span>
      <CheckoutField
        name={`${owner}PhoneLast`}
        label={`${label} 휴대전화 끝자리`}
        placeholder="0000"
        type="tel"
        readOnly={readOnly}
      />
    </div>
  );
}
