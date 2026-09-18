"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Select, SelectItem } from "@/components/ui/select";
import { resolveErrorMessage } from "@/constants/error-messages";
import {
  countPasswordClasses,
  passwordStrengthState,
} from "@/constants/password";
import { PHONE_PREFIXES } from "@/constants/phone";
import { ApiError } from "@/lib/http/api-error";
import {
  useCompleteOAuthProfileMutation,
  useRequestEmailVerificationMutation,
  useSignupMutation,
  useVerifyEmailCodeMutation,
} from "@/queries/member/mutations";
import { useAuthStore } from "@/stores/auth";
import type { OAuthProvider } from "@/types/auth";

import { TermsAgreementFields } from "./TermsAgreementFields";

/**
 * 화면 레이아웃 출처: Figma `[삼성가고싶어요] GUI` 파일, 회원가입 프레임(SU-2, 노드
 * `2103:40173` — 정확한 노드 id. 이전 주석의 `1271:57093`은 존재하지 않는 id였고, 그 값으로
 * 조회했을 때 도메인 select 구조가 보였던 건 다른 프레임(예: `[SU-2-social]`)을 잘못 짚었기
 * 때문이었다. 2026-09-16, `2103:40173`을 다시 정확히 대조해 바로잡음). 라벨이 입력창 왼쪽에
 * 나란히 있는 888px 폭 행(라벨 90px + 입력창 774px)인 건 맞았지만, 이메일 필드는 로컬파트+
 * 도메인 select가 아니라 **"example@email.com" placeholder 하나짜리 단일 입력**이다.
 *
 * 이메일 인증은 실제 BE 계약이 아니라 placeholder다(design.md §0.1·§7-2).
 */

const nameSchema = z
  .string()
  .trim()
  .min(1, "이름을 입력해주세요.")
  .regex(/^[가-힣a-zA-Z\s]{2,20}$/, "이름은 한글·영문 2~20자로 입력해주세요.");

const emailSchema = z
  .string()
  .min(1, "이메일을 입력해주세요.")
  .email("이메일 형식이 올바르지 않아요.");

const phoneFieldsSchema = z.object({
  phonePrefix: z.enum(PHONE_PREFIXES),
  phoneMiddle: z.string().regex(/^\d{4}$/, "숫자 4자리를 입력해주세요."),
  phoneLast: z.string().regex(/^\d{4}$/, "숫자 4자리를 입력해주세요."),
});

const termsFieldsSchema = z.object({
  age14OrOlder: z.boolean().refine((v) => v, {
    message: "만 14세 이상만 가입할 수 있어요.",
  }),
  termsOfService: z.boolean().refine((v) => v, {
    message: "이용약관에 동의해주세요.",
  }),
  privacyCollection: z.boolean().refine((v) => v, {
    message: "개인정보 수집·이용에 동의해주세요.",
  }),
  privacyThirdParty: z.boolean().refine((v) => v, {
    message: "개인정보 제3자 제공에 동의해주세요.",
  }),
  marketing: z.boolean(),
  eventPromotion: z.boolean(),
});

export const signupInfoSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: z
      .string()
      .min(8, "비밀번호는 8자 이상 입력해주세요.")
      .max(20, "비밀번호는 20자 이하로 입력해주세요.")
      .refine(
        (value) => countPasswordClasses(value) >= 3,
        "영문 대/소문자, 숫자, 특수기호(!,@,#,$,%) 중 3가지 이상 포함해주세요.",
      ),
    passwordConfirm: z.string().min(1, "비밀번호를 다시 입력해주세요."),
  })
  .merge(phoneFieldsSchema)
  .merge(termsFieldsSchema)
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않아요.",
    path: ["passwordConfirm"],
  });

export type SignupInfoFormValues = z.infer<typeof signupInfoSchema>;

/**
 * 소셜 추가정보 모드 스키마. 이름·전화번호·약관은 이메일 가입과 동일하게 검증한다. 이메일은
 * provider가 인증된 값을 안 줬을 때만(네이버) 직접 입력이 필요하고, 준 경우(카카오)는 이미
 * 유효한 값이 채워져 있어 같은 `emailSchema`로도 그대로 통과한다.
 *
 * `password`·`passwordConfirm`은 폼에 렌더링하지 않지만 스키마엔 남겨둔다 — 출력 타입을
 * `signupInfoSchema`와 완전히 동일하게(`SignupInfoFormValues`) 맞춰야 `SignupInfoForm`이
 * `useForm` 인스턴스 하나로 두 모드를 처리할 수 있다(모드에 따라 `resolver`만 바꿔 끼운다).
 * 제약을 걸지 않아 기본값 `""`가 그대로 통과한다.
 */
export const socialInfoSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: z.string(),
    passwordConfirm: z.string(),
  })
  .merge(phoneFieldsSchema)
  .merge(termsFieldsSchema);

type VerificationStatus = "idle" | "sent" | "verified";

const RESEND_COOLDOWN_SECONDS = 60;

function mapSignupError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "CONFLICT") return "이미 가입된 이메일이에요.";
    if (error.code === "FORBIDDEN") return "이메일 인증을 먼저 완료해주세요.";
    return resolveErrorMessage(error.code, error.status);
  }
  return resolveErrorMessage();
}

/**
 * Figma 행 레이아웃(라벨 90px 왼쪽 + 필드 나머지) 공통 wrapper. 순수 레이아웃만 담당 —
 * 에러 표시는 각 필드 자리의 `InputField`가 직접 한다(`error` prop). 한 행에 입력이 여럿이면
 * (이메일·휴대전화) 그 행의 첫 필드가 대표로 에러를 보여준다 — 별도 에러 슬롯을 또 두면
 * `InputField` 자체 에러 표시와 중복된다.
 */
function FieldRow({
  label,
  required = true,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full items-start gap-4">
      <span className="flex w-[5.625rem] shrink-0 items-center gap-0.5 pt-2 text-[0.8125rem] leading-[1.4] font-bold text-font-dark">
        {label}
        {required && <span className="font-normal text-red-font">*</span>}
      </span>
      <div className="flex flex-1 flex-col gap-1">{children}</div>
    </div>
  );
}

/** 소셜 추가정보 모드 컨텍스트. `null`이면 일반 이메일 가입. */
export interface SocialSignupContext {
  provider: OAuthProvider;
  /** provider가 인증된 이메일을 줬으면 그 값 — 이메일 입력·인증 단계를 생략한다. */
  suggestedEmail: string | null;
}

interface SignupInfoFormProps {
  /** `/signup?returnUrl=...`의 원본 값. 검증은 `safeReturnUrl`이 소비 시점에 한다. */
  returnUrl: string | null;
  /** Figma "취소" 버튼(Submit Row) — 01단계로 되돌아간다. */
  onCancel: () => void;
  /** 소셜 버튼으로 진입했으면 세팅된다. `null`이면 이 폼은 평소처럼 이메일 가입을 받는다. */
  socialContext: SocialSignupContext | null;
}

export function SignupInfoForm({
  returnUrl,
  onCancel,
  socialContext,
}: SignupInfoFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  // 소셜 로그인이 이미 인증된 이메일을 줬으면(카카오) 처음부터 "인증 완료" 상태로 시작해
  // 이메일 입력·인증 UI 전체를 건너뛴다 — 네이버(이메일 미제공)·일반 이메일 가입은 기존과
  // 동일하게 "idle"에서 시작한다.
  const isSocialEmailProvided = socialContext?.suggestedEmail != null;
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(isSocialEmailProvided ? "verified" : "idle");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const requestVerificationMutation = useRequestEmailVerificationMutation();
  const verifyCodeMutation = useVerifyEmailCodeMutation();
  const signupMutation = useSignupMutation();
  const completeOAuthProfileMutation = useCompleteOAuthProfileMutation();

  const {
    register,
    control,
    handleSubmit,
    getValues,
    trigger,
    setError,
    setValue,
    formState: { errors },
  } = useForm<SignupInfoFormValues>({
    resolver: zodResolver(socialContext ? socialInfoSchema : signupInfoSchema),
    defaultValues: {
      name: "",
      email: socialContext?.suggestedEmail ?? "",
      password: "",
      passwordConfirm: "",
      phonePrefix: "010",
      phoneMiddle: "",
      phoneLast: "",
      age14OrOlder: false,
      termsOfService: false,
      privacyCollection: false,
      privacyThirdParty: false,
      marketing: false,
      eventPromotion: false,
    },
  });

  const password = useWatch({ control, name: "password" });
  const requiredTerms = useWatch({
    control,
    name: [
      "age14OrOlder",
      "termsOfService",
      "privacyCollection",
      "privacyThirdParty",
    ],
  });
  const requiredTermsAgreed = requiredTerms.every(Boolean);
  const canSubmit = verificationStatus === "verified" && requiredTermsAgreed;
  const strength = passwordStrengthState(password);
  // "만료"는 별도 state가 아니라 파생값이다 — effect 안에서 다른 state를 또 setState하는
  // cascading render를 피한다(react-hooks/set-state-in-effect).
  const isVerificationExpired =
    verificationStatus === "sent" && secondsLeft <= 0;

  // 10분 인증 유효시간 카운트다운.
  useEffect(() => {
    if (verificationStatus !== "sent" || secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, verificationStatus]);

  // 60초 재발송 쿨다운 — 별도 타이머(인증 유효시간과 독립).
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleSendVerification() {
    const isEmailValid = await trigger("email");
    if (!isEmailValid) return;
    setFormError(null);
    const { email } = getValues();
    try {
      const { expiresInSeconds } =
        await requestVerificationMutation.mutateAsync({
          email,
        });
      setVerificationStatus("sent");
      setVerificationCode("");
      setCodeError(null);
      setSecondsLeft(expiresInSeconds);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      if (error instanceof ApiError && error.code === "CONFLICT") {
        setError("email", { message: "이미 가입된 이메일이에요." });
      } else {
        setFormError(
          error instanceof ApiError
            ? resolveErrorMessage(error.code, error.status)
            : resolveErrorMessage(),
        );
      }
    }
  }

  async function handleVerifyCode() {
    setCodeError(null);
    const { email } = getValues();
    try {
      await verifyCodeMutation.mutateAsync({ email, code: verificationCode });
      setVerificationStatus("verified");
    } catch (error) {
      if (error instanceof ApiError && error.code === "RESOURCE_EXPIRED") {
        // 로컬 타이머가 아직 안 끝났어도(시계 오차 등) BE 기준 만료면 즉시 만료 상태로
        // 맞춘다 — `isVerificationExpired`는 `secondsLeft`에서 파생되므로 이렇게 강제한다.
        setSecondsLeft(0);
        setCodeError("인증 시간이 지났습니다. 재발송해주세요.");
      } else {
        setCodeError("인증코드가 올바르지 않아요.");
      }
    }
  }

  async function onSubmit(values: SignupInfoFormValues) {
    setFormError(null);
    const phone = `${values.phonePrefix}${values.phoneMiddle}${values.phoneLast}`;
    try {
      const { accessToken, user } = socialContext
        ? await completeOAuthProfileMutation.mutateAsync({
            provider: socialContext.provider,
            email: values.email,
            name: values.name,
            phone,
          })
        : await signupMutation.mutateAsync({
            email: values.email,
            password: values.password,
            passwordConfirm: values.passwordConfirm,
            name: values.name,
            phone,
            role: "USER",
            agreements: {
              age14OrOlder: values.age14OrOlder,
              termsOfService: values.termsOfService,
              privacyCollection: values.privacyCollection,
              marketing: values.marketing || values.eventPromotion,
            },
          });
      // 로그인과 동일하게 세션을 만든다(design.md §0.2 — BE 응답 계약 변경 반영 전제).
      useAuthStore.getState().setSession(accessToken, user);
      const target = returnUrl
        ? `/signup/complete?returnUrl=${encodeURIComponent(returnUrl)}`
        : "/signup/complete";
      router.push(target as Route);
    } catch (error) {
      // 인증 메일 발송 단계와 동일하게, 가입 시점에 이메일이 선점된 경합(CONFLICT)은
      // 이메일 필드 에러로 매핑한다 — 폼 상단 일반 에러로만 보여주면 어떤 입력을 고쳐야
      // 하는지 바로 알기 어렵다. 소셜 모드는 이메일이 provider가 준 값이거나 방금 인증한
      // 값이라 필드 에러로 되돌릴 곳이 마땅치 않아 공통 에러로만 보여준다.
      if (
        !socialContext &&
        error instanceof ApiError &&
        error.code === "CONFLICT"
      ) {
        setError("email", { message: mapSignupError(error) });
      } else {
        setFormError(mapSignupError(error));
      }
    }
  }

  const verificationActionLabel =
    verificationStatus === "idle" ? "인증 메일 발송" : "재발송";
  const isEmailLocked = verificationStatus === "verified";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex w-full flex-col gap-16"
    >
      <div className="flex flex-col gap-6">
        <FieldRow label="이름">
          <InputField
            placeholder="홍길동"
            error={errors.name?.message}
            {...register("name")}
          />
        </FieldRow>

        <FieldRow label="이메일">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <InputField
                type="text"
                placeholder="example@email.com"
                disabled={isEmailLocked}
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
            {/* 카카오처럼 provider가 이미 인증된 이메일을 준 경우 인증요청 자체가 필요 없다. */}
            {!isSocialEmailProvided && (
              <Button
                type="button"
                variant="outline"
                size="s"
                disabled={
                  isEmailLocked ||
                  resendCooldown > 0 ||
                  requestVerificationMutation.isPending
                }
                onClick={handleSendVerification}
              >
                {verificationActionLabel}
              </Button>
            )}
          </div>

          {verificationStatus === "sent" && (
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <InputField
                  placeholder="인증코드를 입력해주세요"
                  inputMode="numeric"
                  value={verificationCode}
                  onValueChange={setVerificationCode}
                  error={
                    codeError ??
                    (isVerificationExpired
                      ? "인증 시간이 지났습니다."
                      : undefined)
                  }
                  helperText={
                    isVerificationExpired
                      ? undefined
                      : `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")} 남음`
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="s"
                disabled={
                  isVerificationExpired ||
                  verifyCodeMutation.isPending ||
                  verificationCode.length === 0
                }
                onClick={handleVerifyCode}
              >
                인증 확인
              </Button>
            </div>
          )}
          {verificationStatus === "verified" && (
            <p className="px-2 py-1 text-caption text-font-dark-subtle">
              {isSocialEmailProvided
                ? "제공자가 인증한 이메일이에요."
                : "인증 완료"}
            </p>
          )}
        </FieldRow>

        {socialContext == null && (
          <>
            <FieldRow label="비밀번호">
              <InputField
                type="password"
                placeholder="비밀번호"
                error={errors.password?.message}
                helperText={
                  errors.password?.message
                    ? undefined
                    : "영어 대/소문자 구분, 숫자 및 특수기호(!,@,#,$,%) 최소 3가지 이상 포함 8자리 이상"
                }
                {...register("password")}
              />
            </FieldRow>

            <FieldRow label="비밀번호 확인">
              <InputField
                type="password"
                placeholder="비밀번호 확인"
                error={errors.passwordConfirm?.message}
                {...register("passwordConfirm")}
              />
              <ProgressBar
                className="mt-2 ml-2 max-w-60"
                state={strength.state}
                label="비밀번호 안전도"
                labelEnd={strength.label}
              />
            </FieldRow>
          </>
        )}

        <FieldRow label="휴대전화">
          {/* 행 안의 개별 InputField에 error를 주면(에러 텍스트가 그 필드만 키를 키워) items-center
              정렬 기준이 바뀌어 Select·나머지 입력이 위아래로 밀린다 — 행 자체는 항상 같은
              높이를 유지하도록 에러 텍스트를 행 밖으로 뺐다. Select 기본 높이(h-9)도
              InputField 고정 높이(h-11)와 달라 className="h-11"로 맞춘다. */}
          <div className="flex items-center gap-2">
            <div className="w-36">
              <Controller
                control={control}
                name="phonePrefix"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    ariaLabel="통신사 접두사"
                    className="h-11"
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
        </FieldRow>
      </div>

      <TermsAgreementFields control={control} setValue={setValue} />

      {formError != null && (
        <p role="alert" className="text-body-s text-red-font">
          {formError}
        </p>
      )}

      <div className="flex w-full justify-center gap-3">
        <Button type="button" variant="outline" size="xl" onClick={onCancel}>
          취소
        </Button>
        <Button
          type="submit"
          size="xl"
          className="w-90"
          disabled={!canSubmit}
          loading={
            socialContext
              ? completeOAuthProfileMutation.isPending
              : signupMutation.isPending
          }
        >
          가입하기
        </Button>
      </div>
    </form>
  );
}
