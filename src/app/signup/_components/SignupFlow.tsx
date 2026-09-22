"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { OAuthLoginResult } from "@/api/member/api";
import { resolveErrorMessage } from "@/constants/error-messages";
import { safeReturnUrl } from "@/lib/auth/return-url";
import { useStartOAuthLoginMutation } from "@/queries/member/mutations";
import { useAuthStore } from "@/stores/auth";
import type { OAuthProvider } from "@/types/auth";

import { SignupInfoForm, type SocialSignupContext } from "./SignupInfoForm";
import { SignupMethodStep } from "./SignupMethodStep";
import { SignupStepIndicator } from "./SignupStepIndicator";

type SignupStep = "method" | "info";

interface SignupFlowProps {
  /** `/signup?returnUrl=...`의 원본 값. 검증은 `safeReturnUrl`이 소비 시점에 한다. */
  returnUrl: string | null;
  /**
   * `/login`의 원형 소셜 버튼에서 `/signup?provider=...`로 navigate해 넘어온 경우의 provider.
   * `null`이면 이 화면에 직접 진입한 것 — 01단계(가입 수단 선택)부터 보여준다.
   */
  provider: OAuthProvider | null;
}

/**
 * `/signup`의 01(가입 수단 선택)/02(정보 입력) 스텝 오케스트레이션 + 인증 가드.
 *
 * 가드를 처음엔 `SignupInfoForm`(02단계) 안에만 뒀는데, 그러면 이미 로그인된 사용자가
 * `/signup`에 들어왔을 때 01단계는 가드 없이 그대로 보이고 02로 넘어가야만 리다이렉트되는
 * 구멍이 있었다(design.md §1 리뷰에서 발견) — 그래서 두 스텝을 공통으로 감싸는 이 컴포넌트
 * 레벨로 옮겼다. `LoginForm`의 "이미 인증된 사용자 가드"와 동일 조건.
 *
 * **가드는 "진입 시점" 한 번만 본다(브라우저로 실제 흐름을 돌려보다 발견).** `status`를
 * 계속 지켜보는 effect로 두면, 가입 성공 직후 `SignupInfoForm.onSubmit`이 `setSession()`을
 * 부르는 순간 이 컴포넌트가 여전히 마운트된 채로 `status`가 "authenticated"로 바뀌는 걸
 * 감지해 **이 가드가 먼저 `/`(또는 returnUrl)로 리다이렉트해버리고, `onSubmit`이 의도한
 * `/signup/complete`행 `router.push`를 덮어써버린다** — 실제로 재현됨(가입 완료 화면 대신
 * 홈으로 튕김). `LoginForm`은 같은 구조의 가드가 있어도 문제가 없었는데, 거기선 "이미 인증된
 * 사용자 가드"와 "로그인 성공 후 이동"이 계산하는 목적지가 우연히 같아서(`resolveLoginRedirectTarget`
 * 공유) 두 번 불려도 무해했을 뿐이다 — 여기는 목적지가 다르므로(가드: returnUrl 또는 `/`,
 * 제출 성공: `/signup/complete`) 실제로 충돌한다. `hasCheckedEntryGuard` ref로 "loading이
 * 끝난 첫 순간"에만 판단하고, 그 이후 `status`가 바뀌어도(=가입 성공) 다시 판단하지 않는다 —
 * 이 앱의 인증 store는 메모리 전용이라 "이미 로그인된 채 진입"이 아니고서야 `/signup`이
 * 마운트된 동안 `status`가 authenticated로 바뀌는 경우는 가입 성공뿐이다.
 */
export function SignupFlow({ returnUrl, provider }: SignupFlowProps) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const [step, setStep] = useState<SignupStep>("method");
  const [socialContext, setSocialContext] =
    useState<SocialSignupContext | null>(null);
  // 리뷰 F1: `startMockOAuthLogin`이 실패해도(예: `publicEnv.apiMocking`이 꺼진 배포)
  // 버튼 클릭·`/login` 자동 진입 둘 다 조용히 끝나던 문제 — 01단계에 공통으로 보여줄
  // 에러 메시지를 여기서 소유한다.
  const [oauthErrorMessage, setOauthErrorMessage] = useState<string | null>(
    null,
  );
  const hasCheckedEntryGuard = useRef(false);
  const startOAuthLoginMutation = useStartOAuthLoginMutation();

  /**
   * 소셜 버튼 클릭(`SignupMethodStep`)과 `/login`에서 넘어온 자동 진입(아래 effect) 둘 다
   * 이 콜백 하나로 처리한다 — 목업 판정 결과를 다루는 로직은 한 곳에만 둔다. `useCallback`은
   * 아래 effect의 의존성 배열을 안정시키기 위해서다(effect 자체는 `hasCheckedEntryGuard`로
   * 이미 1회성이 보장돼 있어 참조 안정성이 없어도 동작엔 문제없었지만, exhaustive-deps 규칙을
   * 우회하지 않고 정공법으로 지킨다).
   */
  const handleOAuthComplete = useCallback(
    (result: OAuthLoginResult) => {
      if (result.outcome === "redirecting") return;
      if (result.outcome === "authenticated") {
        useAuthStore.getState().setSession(result.accessToken, result.user);
        router.replace(safeReturnUrl(returnUrl, "/") as Route);
        return;
      }
      setSocialContext({
        provider: result.provider,
        suggestedEmail: result.suggestedEmail,
      });
      setStep("info");
    },
    [returnUrl, router],
  );

  useEffect(() => {
    if (status === "loading" || hasCheckedEntryGuard.current) return;
    hasCheckedEntryGuard.current = true;
    if (status === "authenticated") {
      router.replace(safeReturnUrl(returnUrl, "/") as Route);
      return;
    }
    // status가 "anonymous"로 확정된 시점에만, `/login`에서 provider와 함께 넘어온 경우
    // `SignupMethodStep`의 버튼 클릭과 동일한 로직을 한 번 자동 실행한다.
    if (provider) {
      startOAuthLoginMutation.mutate(provider, {
        onSuccess: handleOAuthComplete,
        onError: () => setOauthErrorMessage(resolveErrorMessage()),
      });
    }
    // `hasCheckedEntryGuard` 가드가 있어 `handleOAuthComplete`·`startOAuthLoginMutation`이
    // 매 렌더 새 참조라도 이 effect가 두 번째로 실제 로직을 실행하는 일은 없다 — 재실행돼도
    // 위 가드에서 막힌다.
  }, [
    status,
    returnUrl,
    router,
    provider,
    startOAuthLoginMutation,
    handleOAuthComplete,
  ]);

  // `provider`로 진입했으면 목업 판정이 끝나 `step`이 "info"로 바뀌거나(추가정보 필요)
  // 리다이렉트가 시작될 때까지(연동됨) 01단계 UI를 아예 그리지 않는다 — 안 그러면 그 사이
  // 01단계가 잠깐 보였다 사라지는 깜빡임이 생긴다. mutation이 실패하면(목업에선 사실상
  // 없지만 방어적으로) 무한 로딩에 갇히지 않도록 01단계로 빠져나간다.
  const isResolvingOAuthEntry =
    provider != null && step === "method" && !startOAuthLoginMutation.isError;

  if (status !== "anonymous" || isResolvingOAuthEntry) {
    return (
      <output
        aria-live="polite"
        className="flex min-h-[50vh] items-center justify-center text-sm text-neutral-500"
      >
        불러오는 중…
      </output>
    );
  }

  return (
    // Figma SU-1/SU-2(`1175:17131`·`2103:40173`) 대조: 바깥 "Container"는 888px(=55.5rem,
    // 1440px 프레임에서 좌우 276px 여백)로 헤더(제목+스텝) 행이 그 폭 전체를 쓰고, 실제 스텝
    // 콘텐츠(01의 버튼들)만 그 안에서 432px(=27rem)로 다시 좁아져 가운데 정렬된다. 이전엔
    // 헤더까지 432px 안에 욱여넣어서 "회원 가입" 제목이 두 줄로 줄바꿈되는 등 Figma와 달랐다.
    <div className="mx-auto flex w-full max-w-[55.5rem] flex-col items-center px-4 pt-16 pb-50">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-title-xl text-font-dark">회원 가입</h1>
        <SignupStepIndicator current={step === "method" ? 1 : 2} />
      </div>

      {step === "method" ? (
        <div className="mt-16 flex w-full max-w-[27rem] flex-col items-center">
          <SignupMethodStep
            onSelectEmail={() => setStep("info")}
            onOAuthComplete={handleOAuthComplete}
            onOAuthError={() => setOauthErrorMessage(resolveErrorMessage())}
            errorMessage={oauthErrorMessage}
          />
        </div>
      ) : (
        <div className="mt-16 flex w-full flex-col items-center">
          <SignupInfoForm
            returnUrl={returnUrl}
            socialContext={socialContext}
            onCancel={() => {
              setStep("method");
              // 소셜 모드로 들어왔다가 취소하고 다시 "이메일로 가입하기"를 누르면 이메일
              // 가입 모드로 정상 복귀해야 한다 — 안 지우면 소셜 모드가 그대로 남는다.
              setSocialContext(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
