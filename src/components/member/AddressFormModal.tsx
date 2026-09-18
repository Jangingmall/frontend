"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useId } from "react";
import { useKakaoPostcodePopup } from "react-daum-postcode";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { InputField } from "@/components/ui/input-field";
import { Select, SelectItem } from "@/components/ui/select";
import { PHONE_PREFIXES, splitPhone } from "@/constants/phone";
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
 *
 * 2026-09-17 `get_design_context`(ID-3-add, node `1271:59014`) 재대조로 세 가지 정정:
 * 라벨이 입력창 위가 아니라 왼쪽(56px 폭 + 48px 간격)에 있고, "주소검색" 버튼은 outline이
 * 아니라 solid 검정이고, `Dialog`의 `variant="form"` 기본 548px 스크롤 영역을 이 짧은
 * 폼에 그대로 쓰면 내용 아래로 빈 공간이 크게 남아 `scrollableContent={false}`로 뺐다
 * (사용자 피드백).
 *
 * 2026-09-18 같은 노드 재대조: 이 모달의 모든 필드(이름·전화·우편번호·기본주소·상세주소)가
 * Figma에서 전부 36px(`h-9`) — `InputField`의 전역 기본 44px(`h-11`, 회원정보 수정 페이지
 * 기준)이 아니다. 전 수정에서 `Select`를 44px로 올린 게 반대 방향이었다 — `Select`의 기본
 * 36px가 맞고, `InputField` 쪽을 이 모달에서만 36px로 낮춰야 한다(`className="h-9"`).
 * "주소검색" 버튼도 Figma가 `min-h-36`이라 `size="s"`(44px) 대신 `className="h-9"`로 맞춘다.
 */

const addressFormSchema = z.object({
  recipientName: z.string().trim().min(1, "받는 사람 이름을 입력해주세요."),
  phonePrefix: z.enum(PHONE_PREFIXES),
  // 끝 4자리는 `splitPhone`이 문자열 끝에서 고정으로 떼어내므로 항상 정확히 4자리다.
  // 중간은 10자리 전체번호(접두사+7자리)의 기존 배송지도 수정 가능해야 해서 3~4자리를
  // 허용한다(`constants/phone.ts`의 `splitPhone` 주석 참고, CodeRabbit 리뷰로 발견).
  phoneMiddle: z.string().regex(/^\d{3,4}$/, "숫자 3~4자리를 입력해주세요."),
  phoneLast: z.string().regex(/^\d{4}$/, "숫자 4자리를 입력해주세요."),
  zipCode: z.string().min(1, "주소를 검색해주세요."),
  address1: z.string().min(1, "주소를 검색해주세요."),
  address2: z.string().trim().min(1, "상세주소를 입력해주세요."),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

/** 배송지 폼 전용 행 — 라벨(56px, 좌측) + 48px 간격 + 입력(나머지 폭). Figma ID-3-add
 * 실측(2026-09-17) — `FieldRow`(회원정보 수정, 90px/24px)와는 폭·간격이 달라 같이 안 쓴다.
 *
 * content wrapper에 `min-w-0`이 필요하다(2026-09-18, 사용자 피드백) — 휴대전화 행처럼
 * children이 그 안에서 또 flex row(select+input 여러 칸)를 이루면, 이 wrapper도 flex item
 * 이라 기본 `min-width:auto`가 자기 몫(flex-basis 0%로 나뉜 폭)보다 넓게 그 flex row의
 * preferred 폭까지 부풀린다 — 그 결과 휴대전화 행만 다른 행(이름·주소)보다 오른쪽으로
 * 12px 더 튀어나갔다. `min-w-0`으로 자기 몫만큼만 쓰도록 막는다. */
function AddressFieldRow({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-12">
      <span className="flex w-14 shrink-0 items-center gap-0.5 pt-2 text-body-s-b text-font-dark">
        {label}
        {required && <span className="font-normal text-red-font">*</span>}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  );
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
            {mode === "add" ? "추가" : "수정"}
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

        <AddressFieldRow label="이름" required>
          <InputField
            aria-label="이름"
            placeholder="홍길동"
            className="h-9"
            error={errors.recipientName?.message}
            {...register("recipientName")}
          />
        </AddressFieldRow>

        <AddressFieldRow label="휴대전화" required>
          {/* `InputField`/`Select`는 `className`을 안쪽 박스에만 꽂는다 — 이 행처럼 여러
              칸을 균등 분배(Figma 3칸 모두 `flex-1`)하려면 바깥에 `flex-1` div로 한 번 더
              감싸야 한다. `min-w-0`도 같이 줘야 한다 — flex item 기본 `min-width:auto`가
              내용 크기(문자+아이콘)로 최소폭을 강제해 접두사 칸만 좁게 눌러앉는다
              (사용자 피드백으로 확인). 이 모달은 Figma상 전부 36px(`h-9`) 행이라 `Select`는
              전역 기본값(36px) 그대로 두고, `InputField`만 `className="h-9"`로 낮춘다. */}
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
        </AddressFieldRow>

        <AddressFieldRow label="주소" required>
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
              onClick={handleSearchAddress}
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
        </AddressFieldRow>

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
