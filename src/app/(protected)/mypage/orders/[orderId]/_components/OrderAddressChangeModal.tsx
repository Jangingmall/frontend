"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useKakaoPostcodePopup } from "react-daum-postcode";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type { ChangeOrderAddressRequest } from "@/api/orders/api";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { InputField } from "@/components/ui/input-field";
import { Select, SelectItem } from "@/components/ui/select";
import { PHONE_PREFIXES, splitPhone } from "@/constants/phone";
import type { OrderShippingAddress } from "@/types/order";

/**
 * 이 주문 1건의 배송지만 바꾸는 모달. 회원 배송지 목록 CRUD(`components/member/
 * AddressFormModal`)와 필드 구성은 같지만 용도가 달라(기본 배송지 설정 없음) 별도로 둔다
 * (design.md §4.3, Figma `2077:111964` 실측).
 */

const orderAddressFormSchema = z.object({
  recipientName: z.string().trim().min(1, "받는 사람 이름을 입력해주세요."),
  phonePrefix: z.enum(PHONE_PREFIXES),
  phoneMiddle: z.string().regex(/^\d{3,4}$/, "숫자 3~4자리를 입력해주세요."),
  phoneLast: z.string().regex(/^\d{4}$/, "숫자 4자리를 입력해주세요."),
  zipCode: z.string().min(1, "주소를 검색해주세요."),
  address1: z.string().min(1, "주소를 검색해주세요."),
  address2: z.string().trim().min(1, "상세주소를 입력해주세요."),
});

type OrderAddressFormValues = z.infer<typeof orderAddressFormSchema>;

function toDefaultValues(
  address: OrderShippingAddress,
): OrderAddressFormValues {
  return {
    recipientName: address.recipientName,
    ...splitPhone(address.phone),
    zipCode: address.zipCode,
    address1: address.address1,
    address2: address.address2,
  };
}

interface OrderAddressChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: OrderShippingAddress;
  submitting?: boolean;
  submitError?: string | null;
  onSubmit: (input: ChangeOrderAddressRequest) => void;
}

export function OrderAddressChangeModal({
  open,
  onOpenChange,
  initialValue,
  submitting = false,
  submitError = null,
  onSubmit,
}: OrderAddressChangeModalProps) {
  const formId = useId();
  const openPostcode = useKakaoPostcodePopup();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OrderAddressFormValues>({
    resolver: zodResolver(orderAddressFormSchema),
    values: toDefaultValues(initialValue),
  });

  function close(next: boolean) {
    if (submitting) return;
    if (!next) reset(toDefaultValues(initialValue));
    onOpenChange(next);
  }

  async function handleSearchAddress() {
    await openPostcode({
      onComplete: (data) => {
        setValue("zipCode", data.zonecode, { shouldValidate: true });
        setValue("address1", data.roadAddress, { shouldValidate: true });
      },
    });
  }

  function submit(values: OrderAddressFormValues) {
    onSubmit({
      recipientName: values.recipientName,
      phone: `${values.phonePrefix}${values.phoneMiddle}${values.phoneLast}`,
      zipCode: values.zipCode,
      address1: values.address1,
      address2: values.address2,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="배송지 변경"
      variant="form"
      scrollableContent={false}
      footer={
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="xl"
            className="max-w-40 min-w-0 flex-1"
            disabled={submitting}
            onClick={() => close(false)}
          >
            취소
          </Button>
          <Button
            type="submit"
            form={formId}
            size="xl"
            className="min-w-0 flex-1"
            loading={submitting}
          >
            변경
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => void handleSubmit(submit)(event)}
        noValidate
        className="space-y-3"
      >
        {submitError != null && (
          <p role="alert" className="text-body-s text-red-font">
            {submitError}
          </p>
        )}

        <div className="flex items-start gap-12">
          <span className="flex w-14 shrink-0 items-center gap-0.5 pt-2 text-body-s-b text-font-dark">
            이름<span className="font-normal text-red-font">*</span>
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <InputField
              aria-label="이름"
              placeholder="홍길동"
              className="h-9"
              error={errors.recipientName?.message}
              {...register("recipientName")}
            />
          </div>
        </div>

        <div className="flex items-start gap-12">
          <span className="flex w-14 shrink-0 items-center gap-0.5 pt-2 text-body-s-b text-font-dark">
            휴대전화<span className="font-normal text-red-font">*</span>
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <Controller
                  control={control}
                  name="phonePrefix"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      ariaLabel="통신사 접두사"
                    >
                      {PHONE_PREFIXES.map((prefix) => (
                        <SelectItem key={prefix} value={prefix}>
                          {prefix}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />
              </div>
              <span className="text-font-dark">-</span>
              <div className="min-w-0 flex-1">
                <InputField
                  aria-label="휴대전화 가운데 4자리"
                  inputMode="numeric"
                  placeholder="0000"
                  className="h-9"
                  {...register("phoneMiddle")}
                />
              </div>
              <span className="text-font-dark">-</span>
              <div className="min-w-0 flex-1">
                <InputField
                  aria-label="휴대전화 마지막 4자리"
                  inputMode="numeric"
                  placeholder="0000"
                  className="h-9"
                  {...register("phoneLast")}
                />
              </div>
            </div>
            {(errors.phoneMiddle?.message ?? errors.phoneLast?.message) !=
              null && (
              <p className="px-2 py-1 text-caption text-red-font">
                {errors.phoneMiddle?.message ?? errors.phoneLast?.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-12">
          <span className="flex w-14 shrink-0 items-center gap-0.5 pt-2 text-body-s-b text-font-dark">
            주소<span className="font-normal text-red-font">*</span>
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <InputField
                  aria-label="우편번호"
                  placeholder="우편번호"
                  className="h-9"
                  readOnly
                  error={errors.zipCode?.message ?? errors.address1?.message}
                  {...register("zipCode")}
                />
              </div>
              <Button
                type="button"
                size="s"
                className="h-9 shrink-0"
                onClick={() => void handleSearchAddress()}
              >
                주소검색
              </Button>
            </div>
            <InputField
              aria-label="기본주소"
              placeholder="기본주소"
              className="h-9"
              readOnly
              {...register("address1")}
            />
            <InputField
              aria-label="상세주소"
              placeholder="상세주소"
              className="h-9"
              error={errors.address2?.message}
              {...register("address2")}
            />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
