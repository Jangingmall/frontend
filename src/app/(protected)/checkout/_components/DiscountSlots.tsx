import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Select, SelectItem } from "@/components/ui/select";

import { CheckoutFieldRow } from "./CheckoutFieldRow";
export function DiscountSlots({
  unavailable = false,
}: {
  unavailable?: boolean;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-title-m">할인/부가결제</h2>
      <div className="space-y-2">
        <CheckoutFieldRow label="할인코드">
          <div className="grid grid-cols-[minmax(0,1fr)_124px] gap-1">
            <InputField
              aria-label="할인코드"
              placeholder="할인코드 입력"
              className="h-9"
              readOnly
            />
            <Button type="button" disabled size="xs" className="h-9">
              코드적용
            </Button>
          </div>
        </CheckoutFieldRow>
        <CheckoutFieldRow label="적립금">
          <div className="grid grid-cols-[minmax(0,1fr)_124px] gap-1">
            <InputField
              aria-label="적립금"
              placeholder="사용할 금액 입력"
              className="h-9"
              readOnly
              helperText={
                unavailable
                  ? "사용 가능 적립금 : 확인 불가 (서비스 준비 중)"
                  : "사용 가능 적립금 : 0 원"
              }
            />
            <Button type="button" disabled size="xs" className="h-9">
              전액 사용하기
            </Button>
          </div>
        </CheckoutFieldRow>
        <CheckoutFieldRow label="쿠폰">
          <Select ariaLabel="쿠폰" placeholder="사용할 쿠폰 입력" disabled>
            <SelectItem value="none">
              {unavailable
                ? "쿠폰 서비스 준비 중입니다."
                : "사용 가능한 쿠폰이 없습니다."}
            </SelectItem>
          </Select>
          <p className="px-2 py-1 text-caption">
            {unavailable
              ? "사용 가능 쿠폰 : 확인 불가 (서비스 준비 중)"
              : "사용 가능 쿠폰 : 0매"}
          </p>
        </CheckoutFieldRow>
      </div>
    </section>
  );
}
