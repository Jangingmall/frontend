"use client";

import { useState } from "react";
import {
  type Control,
  Controller,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";

import type { SignupInfoFormValues } from "./SignupInfoForm";
import { TermsDetailDialog } from "./TermsDetailDialog";

/**
 * 약관 동의 섹션(SU-2). 필수 4종 + 선택 2종 — Figma 기준(design.md §0 "IA 시트 vs Figma
 * 불일치"). BE `MemberSignupRequest.Agreements`엔 `privacyThirdParty` 대응 필드가 없어
 * 클라이언트에서만 체크를 요구하고 요청 바디엔 안 싣는다(design.md §7-7). `marketing`·
 * `eventPromotion`은 제출 시 BE `marketing` 필드 하나로 합쳐 보낸다(`SignupInfoForm.onSubmit`).
 */
const TERMS_ITEMS = [
  {
    key: "age14OrOlder",
    label: "만 14세 이상입니다.",
    dialogTitle: "만 14세 이상 확인",
    required: true,
  },
  {
    key: "termsOfService",
    label: "이용약관 동의",
    dialogTitle: "이용약관",
    required: true,
  },
  {
    key: "privacyCollection",
    label: "개인정보 수집 및 이용 동의",
    dialogTitle: "개인정보 수집 및 이용",
    required: true,
  },
  {
    key: "privacyThirdParty",
    label: "개인정보 제3자 제공 동의",
    dialogTitle: "개인정보 제3자 제공",
    required: true,
  },
  {
    key: "marketing",
    label: "마케팅 정보 수신 동의",
    dialogTitle: "마케팅 정보 수신",
    required: false,
  },
  {
    key: "eventPromotion",
    label: "이벤트 / 프로모션 알림 동의",
    dialogTitle: "이벤트 / 프로모션 알림",
    required: false,
  },
] as const satisfies readonly {
  key: keyof Pick<
    SignupInfoFormValues,
    | "age14OrOlder"
    | "termsOfService"
    | "privacyCollection"
    | "privacyThirdParty"
    | "marketing"
    | "eventPromotion"
  >;
  label: string;
  dialogTitle: string;
  required: boolean;
}[];

const TERMS_KEYS = TERMS_ITEMS.map((item) => item.key);

interface TermsAgreementFieldsProps {
  control: Control<SignupInfoFormValues>;
  setValue: UseFormSetValue<SignupInfoFormValues>;
}

export function TermsAgreementFields({
  control,
  setValue,
}: TermsAgreementFieldsProps) {
  const [openKey, setOpenKey] = useState<
    (typeof TERMS_ITEMS)[number]["key"] | null
  >(null);
  const watched = useWatch({ control, name: TERMS_KEYS });
  const allChecked = watched.every(Boolean);
  const openItem = TERMS_ITEMS.find((item) => item.key === openKey) ?? null;

  function handleToggleAll(checked: boolean) {
    TERMS_KEYS.forEach((key) =>
      setValue(key, checked, { shouldValidate: true }),
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Checkbox checked={allChecked} onCheckedChange={handleToggleAll}>
        전체 동의하기
      </Checkbox>

      <div className="flex flex-col gap-3 border-t border-font-dark/30 py-3">
        {TERMS_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <Controller
              control={control}
              name={item.key}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                >
                  {item.label} {item.required ? "(필수)" : "(선택)"}
                </Checkbox>
              )}
            />
            <button
              type="button"
              onClick={() => setOpenKey(item.key)}
              className="px-2 py-1 text-caption text-font-dark-subtle underline"
            >
              자세히 보기
            </button>
          </div>
        ))}
      </div>

      <TermsDetailDialog
        open={openItem != null}
        onOpenChange={(open) => {
          if (!open) setOpenKey(null);
        }}
        title={openItem?.dialogTitle ?? ""}
        onAgree={() => {
          if (openItem) setValue(openItem.key, true, { shouldValidate: true });
          setOpenKey(null);
        }}
      />
    </div>
  );
}
