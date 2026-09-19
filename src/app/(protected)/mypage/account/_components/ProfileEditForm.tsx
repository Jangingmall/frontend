"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Select, SelectItem } from "@/components/ui/select";
import { resolveErrorMessage } from "@/constants/error-messages";
import { PHONE_PREFIXES, splitPhone } from "@/constants/phone";
import { ApiError } from "@/lib/http/api-error";
import { useUpdateProfileMutation } from "@/queries/member/mutations";
import type { MemberProfile } from "@/types/member";

import { FieldRow } from "./FieldRow";
import { ProviderBadge } from "./ProviderBadge";

/**
 * 이름·휴대전화 수정 인라인 폼(Figma ID-1-edit). 비밀번호는 다루지 않는다 —
 * `PasswordChangeTab`으로 완전히 분리했다(design.md §7-8). 이메일은 BE에 변경
 * API가 없어 읽기 전용으로 표시만 한다(§7-3).
 */
const profileFormSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요."),
  phonePrefix: z.enum(PHONE_PREFIXES),
  // 끝 4자리는 `splitPhone`이 문자열 끝에서 고정으로 떼어내므로 항상 정확히 4자리다.
  // 중간은 10자리 전체번호(접두사+7자리)의 기존 회원도 수정 가능해야 해서 3~4자리를
  // 허용한다(`constants/phone.ts`의 `splitPhone` 주석 참고, CodeRabbit 리뷰로 발견).
  phoneMiddle: z.string().regex(/^\d{3,4}$/, "숫자 3~4자리를 입력해주세요."),
  phoneLast: z.string().regex(/^\d{4}$/, "숫자 4자리를 입력해주세요."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileEditFormProps {
  profile: MemberProfile;
  onCancel: () => void;
  onSuccess: () => void;
}

function ProfileEditForm({
  profile,
  onCancel,
  onSuccess,
}: ProfileEditFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useUpdateProfileMutation();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: profile.name, ...splitPhone(profile.phone) },
  });

  async function submit(values: ProfileFormValues) {
    setFormError(null);
    try {
      await mutation.mutateAsync({
        name: values.name,
        phone: `${values.phonePrefix}${values.phoneMiddle}${values.phoneLast}`,
      });
      onSuccess();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? resolveErrorMessage(error.code, error.status)
          : resolveErrorMessage(),
      );
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
      className="space-y-4 pb-6"
    >
      <h2 className="px-2 text-title-m text-font-dark">내 정보 수정하기</h2>

      {formError != null && (
        <p role="alert" className="text-body-s text-red-font">
          {formError}
        </p>
      )}

      <FieldRow label="이름">
        <InputField
          aria-label="이름"
          placeholder="홍길동"
          className="h-9"
          error={errors.name?.message}
          {...register("name")}
        />
      </FieldRow>

      <FieldRow label="이메일">
        <InputField
          aria-label="이메일"
          value={profile.email}
          className="h-9"
          disabled
          readOnly
        />
      </FieldRow>

      <FieldRow label="휴대전화" required>
        {/* Figma(ID-1-edit, node 1394:95216 `Phone Input Group`) 재대조(2026-09-18):
            이 행은 44px가 아니라 36px(`h-9`) — 이름·이메일 행과 같은 높이다. 세 칸이 똑같이
            `max-w-40`인 게 아니다 — 접두사만 `max-w-[160px]`로 캡이 있고, 나머지 두 자리
            입력칸(중간·마지막 4자리)은 캡 없는 `flex-[1_0_0]`라 남는 폭을 그 둘이 나눠 채운다
            (세 칸을 똑같이 캡 씌웠더니 뒤에 빈 공간이 남았다 — 사용자 피드백). `InputField`/
            `Select`는 `className`이 안쪽 박스에만 꽂혀 바깥 growth를 못 받으므로 `flex-1
            min-w-0` wrapper로 감싼다(배송지 모달과 동일 패턴). `Select` 기본 높이(36px)는
            그대로 두고 `InputField`만 `h-9`로 맞춘다. */}
        <div className="flex items-center gap-2">
          <div className="max-w-40 min-w-0 flex-1">
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
        {(errors.phoneMiddle?.message ?? errors.phoneLast?.message) != null && (
          <p className="px-2 py-1 text-caption text-red-font">
            {errors.phoneMiddle?.message ?? errors.phoneLast?.message}
          </p>
        )}
      </FieldRow>

      {profile.authProvider !== "local" && (
        <FieldRow label="간편로그인">
          <ProviderBadge provider={profile.authProvider} variant="pill" />
        </FieldRow>
      )}

      <div className="flex gap-2.5 pt-2">
        <Button
          type="button"
          variant="outline"
          size="xl"
          className="max-w-40 min-w-0 flex-1"
          disabled={mutation.isPending}
          onClick={onCancel}
        >
          취소
        </Button>
        <Button
          type="submit"
          size="xl"
          className="min-w-0 flex-1"
          loading={mutation.isPending}
        >
          수정 완료하기
        </Button>
      </div>
    </form>
  );
}

export { ProfileEditForm };
export type { ProfileEditFormProps };
