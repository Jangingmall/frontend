"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveErrorMessage } from "@/constants/error-messages";
import {
  countPasswordClasses,
  passwordStrengthState,
} from "@/constants/password";
import { ApiError } from "@/lib/http/api-error";
import { useChangePasswordMutation } from "@/queries/member/mutations";
import { useMemberProfileQuery } from "@/queries/member/queries";

import { FieldRow } from "./FieldRow";

/**
 * "비밀번호 변경" 탭. 이 화면 자체를 위한 별도 Figma 프레임은 없지만, ID-1-edit-social
 * 안에 `hidden`으로 남아 있는 "Password Section"이 새 비밀번호 필드의 실제 의도된 스타일
 * (도움말 문구·안전도 표시)을 담고 있다 — 처음엔 다른 hidden 레이어(주소 폼의 미사용
 * 비밀번호 필드)처럼 버려진 레이어로 오인했지만, 이 문구가 회원가입 비밀번호 정책
 * (`constants/password.ts`)과 정확히 일치해 의도된 재사용으로 확인했다. 그래서 도움말
 * 문구·안전도 `ProgressBar`·비밀번호 규칙(영문 대/소문자·숫자·특수기호 중 3종 이상,
 * 8~20자)을 회원가입(`SignupInfoForm`)과 동일하게 맞췄다(사용자 피드백, 2026-09-17).
 *
 * `ProfileEditModal`과 완전히 분리된 흐름이다 — 게이트를 이미 통과했어도
 * `currentPassword`는 여기서 다시 받는다(defense-in-depth). BE `PATCH /me/password`
 * 요청 바디엔 `newPasswordConfirm`이 없어 확인 필드는 클라이언트에서만 검증한다.
 */
const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요."),
    newPassword: z
      .string()
      .min(8, "비밀번호는 8자 이상 입력해주세요.")
      .max(20, "비밀번호는 20자 이하로 입력해주세요.")
      .refine(
        (value) => countPasswordClasses(value) >= 3,
        "영문 대/소문자, 숫자, 특수기호(!,@,#,$,%) 중 3가지 이상 포함해주세요.",
      ),
    newPasswordConfirm: z.string().min(1, "새 비밀번호를 다시 입력해주세요."),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: "비밀번호가 일치하지 않아요.",
    path: ["newPasswordConfirm"],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

function PasswordChangeTab() {
  const profileQuery = useMemberProfileQuery();

  if (profileQuery.isPending) {
    return (
      <div className="space-y-3 pb-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-60" />
      </div>
    );
  }

  if (profileQuery.isError) {
    const error = profileQuery.error;
    return (
      <ErrorState
        code={error instanceof ApiError ? error.code : undefined}
        status={error instanceof ApiError ? error.status : undefined}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  if (profileQuery.data.authProvider !== "local") {
    return (
      <EmptyState
        title="간편로그인 계정은 비밀번호가 없어요"
        description="소셜 로그인 계정은 비밀번호 변경이 필요하지 않습니다."
      />
    );
  }

  return <PasswordChangeForm />;
}

function PasswordChangeForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mutation = useChangePasswordMutation();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
    },
  });
  const newPassword = useWatch({ control, name: "newPassword" });
  const strength = passwordStrengthState(newPassword);

  async function submit(values: PasswordFormValues) {
    setFormError(null);
    setSuccessMessage(null);
    try {
      await mutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      setSuccessMessage("비밀번호가 변경되었습니다.");
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_INPUT") {
        setFormError("현재 비밀번호가 일치하지 않습니다.");
      } else {
        setFormError(
          error instanceof ApiError
            ? resolveErrorMessage(error.code, error.status)
            : resolveErrorMessage(),
        );
      }
    }
  }

  return (
    <div className="space-y-6 pb-6">
      <h2 className="px-3 text-title-m text-font-dark">비밀번호 변경</h2>

      <form
        onSubmit={(event) => void handleSubmit(submit)(event)}
        noValidate
        className="space-y-3 px-3"
      >
        {formError != null && (
          <p role="alert" className="text-body-s text-red-font">
            {formError}
          </p>
        )}
        {successMessage != null && (
          <p role="status" className="text-body-s text-font-dark">
            {successMessage}
          </p>
        )}

        <FieldRow label="현재 비밀번호" required>
          <InputField
            aria-label="현재 비밀번호"
            type="password"
            placeholder="현재 비밀번호"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
        </FieldRow>
        <FieldRow label="새 비밀번호" required>
          <InputField
            aria-label="새 비밀번호"
            type="password"
            placeholder="새 비밀번호"
            helperText={
              errors.newPassword?.message
                ? undefined
                : "영어 대/소문자 구분, 숫자 및 특수기호(!,@,#,$,%) 최소 3가지 이상 포함 8자리 이상"
            }
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
        </FieldRow>
        <FieldRow label="비밀번호 확인" required>
          <InputField
            aria-label="비밀번호 확인"
            type="password"
            placeholder="비밀번호 확인"
            error={errors.newPasswordConfirm?.message}
            {...register("newPasswordConfirm")}
          />
          <ProgressBar
            className="max-w-60"
            state={strength.state}
            label="비밀번호 안전도"
            labelEnd={strength.label}
          />
        </FieldRow>

        <div className="flex gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="xl"
            className="max-w-40 min-w-0 flex-1"
            disabled={mutation.isPending}
            onClick={() => reset()}
          >
            취소
          </Button>
          <Button
            type="submit"
            size="xl"
            className="min-w-0 flex-1"
            loading={mutation.isPending}
          >
            변경하기
          </Button>
        </div>
      </form>
    </div>
  );
}

export { PasswordChangeTab };
