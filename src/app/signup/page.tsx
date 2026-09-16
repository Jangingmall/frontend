import type { Metadata } from "next";

import { SignupFlow } from "./_components/SignupFlow";

export const metadata: Metadata = {
  title: "회원가입 | 장인몰",
  robots: { index: false, follow: false },
};

interface SignupPageProps {
  // LoginPage와 동일한 이유로 string[] 가능성을 방어한다(§`app/login/page.tsx`).
  searchParams: Promise<{
    returnUrl?: string | string[];
    provider?: string | string[];
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { returnUrl, provider: rawProvider } = await searchParams;
  // `/login`의 원형 소셜 버튼이 붙여주는 값. URL은 임의 문자열이 올 수 있으니 허용된 두
  // 값으로만 좁힌다 — 그 외 값(또는 없음)은 무시하고 평소처럼 01단계부터 보여준다.
  const provider =
    rawProvider === "naver" || rawProvider === "kakao" ? rawProvider : null;
  return (
    <SignupFlow
      returnUrl={typeof returnUrl === "string" ? returnUrl : null}
      provider={provider}
    />
  );
}
