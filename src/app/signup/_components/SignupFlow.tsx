"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { safeReturnUrl } from "@/lib/auth/return-url";
import { useAuthStore } from "@/stores/auth";

import { SignupInfoForm } from "./SignupInfoForm";
import { SignupMethodStep } from "./SignupMethodStep";
import { SignupStepIndicator } from "./SignupStepIndicator";

type SignupStep = "method" | "info";

interface SignupFlowProps {
  /** `/signup?returnUrl=...`의 원본 값. 검증은 `safeReturnUrl`이 소비 시점에 한다. */
  returnUrl: string | null;
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
export function SignupFlow({ returnUrl }: SignupFlowProps) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const [step, setStep] = useState<SignupStep>("method");
  const hasCheckedEntryGuard = useRef(false);

  useEffect(() => {
    if (status === "loading" || hasCheckedEntryGuard.current) return;
    hasCheckedEntryGuard.current = true;
    if (status === "authenticated") {
      router.replace(safeReturnUrl(returnUrl, "/") as Route);
    }
  }, [status, returnUrl, router]);

  if (status !== "anonymous") {
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
          <SignupMethodStep onSelectEmail={() => setStep("info")} />
        </div>
      ) : (
        <div className="mt-16 flex w-full flex-col items-center">
          <SignupInfoForm
            returnUrl={returnUrl}
            onCancel={() => setStep("method")}
          />
        </div>
      )}
    </div>
  );
}
