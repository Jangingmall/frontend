"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveErrorMessage } from "@/constants/error-messages";
import { ApiError } from "@/lib/http/api-error";
import { useChangePasswordMutation } from "@/queries/member/mutations";
import { useMemberProfileQuery } from "@/queries/member/queries";

/**
 * "비밀번호 변경" 탭. Figma엔 이 화면 프레임이 따로 없다(ID-1-edit을 만들다 파생된
 * 좌측 내비 항목만 존재) — `ProfileEditModal`과 동일하게 인라인 화면 전환으로
 * 구현하고, 필드 구성은 design.md §7-8 그대로 유지한다.
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
      .max(20, "비밀번호는 20자 이하로 입력해주세요."),
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
      <div className="space-y-3 py-6">
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
    <div className="space-y-6 py-6">
      <h2 className="px-3 text-title-m text-font-dark">비밀번호 변경</h2>

      <form
        onSubmit={(event) => void handleSubmit(submit)(event)}
        noValidate
        className="max-w-165 space-y-3 px-3"
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

        <InputField
          label="현재 비밀번호"
          type="password"
          placeholder="현재 비밀번호"
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
        <InputField
          label="새 비밀번호"
          type="password"
          placeholder="새 비밀번호"
          helperText={
            errors.newPassword?.message
              ? undefined
              : "8자 이상 20자 이하로 입력해주세요."
          }
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <InputField
          label="새 비밀번호 확인"
          type="password"
          placeholder="새 비밀번호 확인"
          error={errors.newPasswordConfirm?.message}
          {...register("newPasswordConfirm")}
        />

        <div className="flex justify-end pt-3">
          <Button type="submit" size="l" loading={mutation.isPending}>
            변경하기
          </Button>
        </div>
      </form>
    </div>
  );
}

export { PasswordChangeTab };
