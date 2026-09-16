import type { OAuthLoginResult } from "@/api/member/api";
import { Button } from "@/components/ui/button";
import { useStartOAuthLoginMutation } from "@/queries/member/mutations";
import type { OAuthProvider } from "@/types/auth";

import { KakaoSignupButton } from "./KakaoSignupButton";
import { NaverSignupButton } from "./NaverSignupButton";

/** 01단계(SU-1) — 가입 수단 선택. */
interface SignupMethodStepProps {
  onSelectEmail: () => void;
  /**
   * 소셜 버튼 클릭 → 목업 OAuth 시작 결과. 이미 연동된 계정이면 `authenticated`, 처음이면
   * `needsProfile` — 02단계로 넘어가 이름·전화번호를 받아야 한다는 뜻이다. 부모
   * (`SignupFlow`)가 두 결과를 어떻게 처리할지 결정한다.
   */
  onOAuthComplete: (result: OAuthLoginResult) => void;
}

export function SignupMethodStep({
  onSelectEmail,
  onOAuthComplete,
}: SignupMethodStepProps) {
  const startOAuthLoginMutation = useStartOAuthLoginMutation();

  function handleOAuthClick(provider: OAuthProvider) {
    startOAuthLoginMutation.mutate(provider, {
      onSuccess: onOAuthComplete,
    });
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="text-center text-caption text-font-dark-subtle">
        아이디와 비밀번호 입력하기 귀찮으시죠?
        <br />
        1초 회원가입으로 입력없이 간편하게 로그인 하세요.
      </p>

      <div className="flex w-90 flex-col gap-4">
        <NaverSignupButton
          onClick={() => handleOAuthClick("naver")}
          loading={startOAuthLoginMutation.isPending}
        />
        <KakaoSignupButton
          onClick={() => handleOAuthClick("kakao")}
          loading={startOAuthLoginMutation.isPending}
        />
      </div>

      <div className="flex w-full items-center gap-1">
        <hr className="h-px flex-1 border-0 bg-border-jade-weak" />
        <span className="text-caption-b text-font-dark-subtle">또는</span>
        <hr className="h-px flex-1 border-0 bg-border-jade-weak" />
      </div>

      <Button
        type="button"
        size="xl"
        className="h-11 w-90 rounded-sm text-sm font-bold"
        onClick={onSelectEmail}
      >
        이메일,비밀번호로 가입하기
      </Button>
    </div>
  );
}
