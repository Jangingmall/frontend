"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { InputField } from "@/components/ui/input-field";
import { Select, SelectItem } from "@/components/ui/select";
import { resolveErrorMessage } from "@/constants/error-messages";
import { PHONE_PREFIXES, type PhonePrefix } from "@/constants/phone";
import { ApiError } from "@/lib/http/api-error";
import { useUpdateProfileMutation } from "@/queries/member/mutations";
import type { MemberProfile } from "@/types/member";

/**
 * 이름·휴대전화 수정 전용 모달. 비밀번호는 다루지 않는다 — `PasswordChangeModal`로 완전히
 * 분리했다(design.md §7-8: 게이트 통과와 별개로 고위험 행위는 독립적으로 재확인).
 * 이메일은 BE에 변경 API가 없어 읽기 전용으로 표시만 한다(§7-3).
 */
const profileFormSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요."),
  phonePrefix: z.enum(PHONE_PREFIXES),
  phoneMiddle: z.string().regex(/^\d{4}$/, "숫자 4자리를 입력해주세요."),
  phoneLast: z.string().regex(/^\d{4}$/, "숫자 4자리를 입력해주세요."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

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

const PROVIDER_LABEL: Record<
  Exclude<MemberProfile["authProvider"], "local">,
  string
> = {
  naver: "네이버",
  kakao: "카카오",
};

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: MemberProfile;
}

function ProfileEditModal({
  open,
  onOpenChange,
  profile,
}: ProfileEditModalProps) {
  const formId = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useUpdateProfileMutation();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: { name: profile.name, ...splitPhone(profile.phone) },
  });

  function close(next: boolean) {
    if (mutation.isPending) return;
    if (!next) {
      reset({ name: profile.name, ...splitPhone(profile.phone) });
      setFormError(null);
    }
    onOpenChange(next);
  }

  async function submit(values: ProfileFormValues) {
    setFormError(null);
    try {
      await mutation.mutateAsync({
        name: values.name,
        phone: `${values.phonePrefix}${values.phoneMiddle}${values.phoneLast}`,
      });
      onOpenChange(false);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? resolveErrorMessage(error.code, error.status)
          : resolveErrorMessage(),
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="내 정보 수정하기"
      variant="form"
      footer={
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="jade"
            size="xl"
            className="min-w-0 flex-1"
            disabled={mutation.isPending}
            onClick={() => close(false)}
          >
            취소
          </Button>
          <Button
            type="submit"
            form={formId}
            size="xl"
            className="min-w-0 flex-1"
            loading={mutation.isPending}
          >
            수정 완료하기
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
        {formError != null && (
          <p role="alert" className="text-body-s text-red-font">
            {formError}
          </p>
        )}

        <InputField
          label="이름"
          placeholder="홍길동"
          error={errors.name?.message}
          {...register("name")}
        />

        <InputField label="이메일" value={profile.email} disabled readOnly />

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

        {profile.authProvider !== "local" && (
          <InputField
            label="간편로그인"
            value={`${PROVIDER_LABEL[profile.authProvider]} 연동됨`}
            disabled
            readOnly
          />
        )}
      </form>
    </Dialog>
  );
}

export { ProfileEditModal };
export type { ProfileEditModalProps };
