"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useKakaoPostcodePopup } from "react-daum-postcode";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { InputField } from "@/components/ui/input-field";
import { Select, SelectItem } from "@/components/ui/select";
import { PHONE_PREFIXES, type PhonePrefix } from "@/constants/phone";
import type { Address, AddressInput } from "@/types/member";

/**
 * 배송지 추가/수정 공용 모달. 마이페이지 배송지 탭과 체크아웃 배송지 선택 모달(CO-2, 후속
 * 작업)이 재사용한다 — `queries/`에 의존하지 않고 `onSubmit`으로 입력값만 넘긴다
 * (architecture.md §6 도메인 컴포넌트 원칙). 주소검색은 `react-daum-postcode`(순수 UI
 * 라이브러리)를 직접 쓴다 — 우리 API·MSW를 거치지 않는다(design.md §2.3).
 *
 * Figma `ID-2-edit`/`ID-2-add`에 있던 비밀번호 입력 필드 2개는 배제했다 — 해당 레이어가
 * `visible: false`로 숨겨진 채 남아 있었고(디자이너가 이미 안 쓰기로 한 것), 배송지 CRUD에
 * 비밀번호가 필요할 도메인적 이유도 없다.
 */

const addressFormSchema = z.object({
  recipientName: z.string().trim().min(1, "받는 사람 이름을 입력해주세요."),
  phonePrefix: z.enum(PHONE_PREFIXES),
  phoneMiddle: z.string().regex(/^\d{4}$/, "숫자 4자리를 입력해주세요."),
  phoneLast: z.string().regex(/^\d{4}$/, "숫자 4자리를 입력해주세요."),
  zipCode: z.string().min(1, "주소를 검색해주세요."),
  address1: z.string().min(1, "주소를 검색해주세요."),
  address2: z.string().trim().min(1, "상세주소를 입력해주세요."),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

function splitPhone(phone: string): {
  phonePrefix: PhonePrefix;
  phoneMiddle: string;
  phoneLast: string;
} {
  const prefix = PHONE_PREFIXES.find((candidate) =>
    phone.startsWith(candidate),
  );
  const rest = prefix ? phone.slice(prefix.length) : phone.slice(3);
  return {
    phonePrefix: prefix ?? "010",
    phoneMiddle: rest.slice(0, 4),
    phoneLast: rest.slice(4, 8),
  };
}

function toDefaultValues(address?: Address): AddressFormValues {
  if (!address) {
    return {
      recipientName: "",
      phonePrefix: "010",
      phoneMiddle: "",
      phoneLast: "",
      zipCode: "",
      address1: "",
      address2: "",
      isDefault: false,
    };
  }
  return {
    recipientName: address.recipientName,
    ...splitPhone(address.phone),
    zipCode: address.zipCode,
    address1: address.address1,
    address2: address.address2,
    isDefault: address.isDefault,
  };
}

interface AddressFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  /** `mode: "edit"`일 때만 필요 — 기존 값으로 폼을 채운다. */
  initialValue?: Address;
  submitting?: boolean;
  submitError?: string | null;
  onSubmit: (input: AddressInput) => void;
}

function AddressFormModal({
  open,
  onOpenChange,
  mode,
  initialValue,
  submitting = false,
  submitError = null,
  onSubmit,
}: AddressFormModalProps) {
  const formId = useId();
  const openPostcode = useKakaoPostcodePopup();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
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

  function submit(values: AddressFormValues) {
    onSubmit({
      recipientName: values.recipientName,
      phone: `${values.phonePrefix}${values.phoneMiddle}${values.phoneLast}`,
      zipCode: values.zipCode,
      address1: values.address1,
      address2: values.address2,
      isDefault: values.isDefault,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={mode === "add" ? "배송지 추가하기" : "배송지 수정하기"}
      variant="form"
      footer={
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="jade"
            size="xl"
            className="min-w-0 flex-1"
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
            {mode === "add" ? "추가" : "수정"}
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => void handleSubmit(submit)(event)}
        noValidate
        className="space-y-4"
      >
        {submitError != null && (
          <p role="alert" className="text-body-s text-red-font">
            {submitError}
          </p>
        )}

        <InputField
          label="받는 사람"
          placeholder="홍길동"
          error={errors.recipientName?.message}
          {...register("recipientName")}
        />

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-32">
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
            <InputField
              inputMode="numeric"
              placeholder="0000"
              {...register("phoneMiddle")}
            />
            <span className="text-font-dark">-</span>
            <InputField
              inputMode="numeric"
              placeholder="0000"
              {...register("phoneLast")}
            />
          </div>
          {(errors.phoneMiddle?.message ?? errors.phoneLast?.message) !=
            null && (
            <p className="px-2 py-1 text-caption text-red-font">
              {errors.phoneMiddle?.message ?? errors.phoneLast?.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <InputField
                placeholder="우편번호"
                readOnly
                error={errors.zipCode?.message ?? errors.address1?.message}
                {...register("zipCode")}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="s"
              onClick={handleSearchAddress}
            >
              주소검색
            </Button>
          </div>
          <InputField
            placeholder="기본주소"
            readOnly
            {...register("address1")}
          />
          <InputField
            placeholder="상세주소"
            error={errors.address2?.message}
            {...register("address2")}
          />
        </div>

        <Controller
          name="isDefault"
          control={control}
          render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={field.onChange}>
              기본 배송지로 설정
            </Checkbox>
          )}
        />
      </form>
    </Dialog>
  );
}

export { AddressFormModal };
export type { AddressFormModalProps };
