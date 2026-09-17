"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { resolveErrorMessage } from "@/constants/error-messages";
import { ApiError } from "@/lib/http/api-error";
import {
  useStartOAuthLoginMutation,
  useVerifyPasswordMutation,
} from "@/queries/member/mutations";
import type { MemberAuthProvider } from "@/types/member";

/**
 * 회원정보 수정 화면 진입 전 본인 확인 게이트(Figma MY-6/MY-6-social).
 *
 * LOCAL: 비밀번호 재입력 → `POST /api/member/login` 재사용 검증(전용 엔드포인트 없음,
 * design.md §7-4). 성공해도 세션은 갱신하지 않고 게이트만 통과시킨다 — 이 값은
 * `ProfileEditModal`/`PasswordChangeModal`로 넘기지 않는다(§7-8, 두 모달이 각자 필요한
 * 값을 독립적으로 다시 받는다).
 *
 * 소셜(NAVER/KAKAO): "다시 로그인해주세요" + provider 버튼. 기존 `startMockOAuthLogin`(T-19)
 * 재사용 — 이미 연동된 provider면 항상 성공한다(실제 재인증은 provider 로그인 화면으로의
 * 풀페이지 리다이렉트인데 목업이 흉내낼 수 없는 알려진 한계, §7-4).
 */
interface PasswordReconfirmGateProps {
  email: string;
  authProvider: MemberAuthProvider;
  onVerified: () => void;
}

function PasswordReconfirmGate({
  email,
  authProvider,
  onVerified,
}: PasswordReconfirmGateProps) {
  if (authProvider === "local") {
    return <LocalGate email={email} onVerified={onVerified} />;
  }
  return <SocialGate provider={authProvider} onVerified={onVerified} />;
}

function LocalGate({
  email,
  onVerified,
}: {
  email: string;
  onVerified: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useVerifyPasswordMutation();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const verified = await mutation.mutateAsync({ email, password });
      if (verified) {
        onVerified();
      } else {
        setError("비밀번호가 일치하지 않습니다.");
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? resolveErrorMessage(err.code, err.status)
          : resolveErrorMessage(),
      );
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="mx-auto flex w-120 flex-col gap-6 py-16"
    >
      <div className="text-center">
        <h1 className="text-title-m text-font-dark">회원 정보 수정</h1>
        <p className="mt-2 text-body-s text-font-dark-weak">
          소중한 개인정보 보호를 위해 비밀번호를 다시 입력해주세요.
        </p>
      </div>
      <InputField
        type="password"
        placeholder="비밀번호"
        value={password}
        onValueChange={setPassword}
        error={error ?? undefined}
      />
      <Button
        type="submit"
        size="xl"
        disabled={password.length === 0}
        loading={mutation.isPending}
      >
        확인
      </Button>
    </form>
  );
}

function SocialGate({
  provider,
  onVerified,
}: {
  provider: "naver" | "kakao";
  onVerified: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const mutation = useStartOAuthLoginMutation();

  async function handleReauth() {
    setError(null);
    try {
      const result = await mutation.mutateAsync(provider);
      if (result.outcome === "authenticated") {
        onVerified();
      } else {
        setError("연동 정보를 확인하지 못했어요. 다시 로그인해주세요.");
      }
    } catch {
      setError(resolveErrorMessage());
    }
  }

  const providerLabel = provider === "naver" ? "네이버" : "카카오";

  return (
    <div className="mx-auto flex w-120 flex-col gap-6 py-16 text-center">
      <div>
        <h1 className="text-title-m text-font-dark">회원 정보 수정</h1>
        <p className="mt-2 text-body-s text-font-dark-weak">
          소중한 개인정보 보호를 위해 로그인을 다시 해주세요.
        </p>
      </div>
      {error != null && (
        <p role="alert" className="text-body-s text-red-font">
          {error}
        </p>
      )}
      <Button
        type="button"
        size="xl"
        loading={mutation.isPending}
        onClick={() => void handleReauth()}
      >
        {providerLabel}로 다시 로그인
      </Button>
    </div>
  );
}

export { PasswordReconfirmGate };
export type { PasswordReconfirmGateProps };
