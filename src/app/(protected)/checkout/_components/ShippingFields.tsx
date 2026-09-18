"use client";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { CheckoutFormValues } from "@/app/(protected)/checkout/_lib/checkout-form-schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { CheckoutField } from "./CheckoutField";
import { CheckoutFieldRow } from "./CheckoutFieldRow";
import { PhoneFields } from "./PhoneFields";
interface ShippingFieldsProps {
  sameCustomer: boolean;
  onSameCustomerChange: (same: boolean) => void;
  onAddressSearch: () => void;
}
export function ShippingFields({
  sameCustomer,
  onSameCustomerChange,
  onAddressSearch,
}: ShippingFieldsProps) {
  const { control, setValue } = useFormContext<CheckoutFormValues>();
  const [name, first, middle, last] = useWatch({
    control,
    name: [
      "customerName",
      "customerPhoneFirst",
      "customerPhoneMiddle",
      "customerPhoneLast",
    ],
  });
  // 체크 후 주문자 입력/수정도 같은 배송정보에 반영한다. 해제하면 수령인 편집을 보존한다.
  useEffect(() => {
    if (!sameCustomer) return;
    setValue("recipientName", name, { shouldValidate: true });
    setValue("recipientPhoneFirst", first, { shouldValidate: true });
    setValue("recipientPhoneMiddle", middle, { shouldValidate: true });
    setValue("recipientPhoneLast", last, { shouldValidate: true });
  }, [sameCustomer, name, first, middle, last, setValue]);
  return (
    <section className="space-y-3">
      <h2 className="text-title-m">배송 정보</h2>
      <Checkbox checked={sameCustomer} onCheckedChange={onSameCustomerChange}>
        주문자 정보와 동일
      </Checkbox>
      <div className="space-y-2">
        <CheckoutFieldRow label="이름" required>
          <CheckoutField
            name="recipientName"
            label="수령인 이름"
            placeholder="이름"
            readOnly={sameCustomer}
          />
        </CheckoutFieldRow>
        <CheckoutFieldRow label="휴대전화" required>
          <PhoneFields owner="recipient" readOnly={sameCustomer} />
        </CheckoutFieldRow>
        <CheckoutFieldRow label="주소" required>
          <div className="space-y-2">
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <CheckoutField
                  name="postcode"
                  label="우편번호"
                  placeholder="우편번호"
                  readOnly
                />
              </div>
              <Button
                type="button"
                size="xs"
                className="h-9"
                onClick={onAddressSearch}
              >
                주소검색
              </Button>
            </div>
            <CheckoutField
              name="address"
              label="기본주소"
              placeholder="기본주소"
              readOnly
            />
            <CheckoutField
              name="addressDetail"
              label="상세주소"
              placeholder="상세주소"
            />
          </div>
        </CheckoutFieldRow>
      </div>
    </section>
  );
}
