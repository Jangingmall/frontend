"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { InputField } from "@/components/ui/input-field";
import { resolveErrorMessage } from "@/constants/error-messages";
import { ApiError } from "@/lib/http/api-error";
import { useChangePasswordMutation } from "@/queries/member/mutations";

/**
 * 비밀번호 변경 전용 모달(LOCAL 계정만). `ProfileEditModal`과 완전히 분리된 흐름이다
 * (design.md §7-8) — 회원정보 수정 게이트를 이미 통과했어도 `currentPassword`는 여기서
 * 다시 받는다. BE `PATCH /me/password` 요청 바디엔 `newPasswordConfirm`이 없어(§2.1)
 * 확인 필드는 클라이언트에서만 검증하고 API엔 안 보낸다.
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

interface PasswordChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PasswordChangeModal({ open, onOpenChange }: PasswordChangeModalProps) {
  const formId = useId();
  const [formError, setFormError] = useState<string | null>(null);
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

  function close(next: boolean) {
    if (mutation.isPending) return;
    if (!next) {
      reset();
      setFormError(null);
    }
    onOpenChange(next);
  }

  async function submit(values: PasswordFormValues) {
    setFormError(null);
    try {
      await mutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      close(false);
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
    <Dialog
      open={open}
      onOpenChange={close}
      title="비밀번호 변경"
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
            변경하기
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
      </form>
    </Dialog>
  );
}

export { PasswordChangeModal };
export type { PasswordChangeModalProps };
