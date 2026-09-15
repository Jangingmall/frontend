import type { Metadata } from "next";

import { LoginForm } from "./_components/LoginForm";

export const metadata: Metadata = {
  title: "로그인 | 장인몰",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  // Next.js 실제 런타임 타입은 값이 하나면 string, 같은 키가 반복되면 string[]이다
  // (`?returnUrl=a&returnUrl=b`) — `string`으로만 좁혀 두면 그 경우 타입과 실제 값이
  // 어긋난다(2026-09-15, PR 리뷰). `safeReturnUrl`은 `string | null`만 받으므로 배열이면
  // 그냥 버린다 — 애초에 정상적인 내비게이션에서 나올 수 없는 형태라 의미 있게 복구할
  // 방법이 없다.
  searchParams: Promise<{ returnUrl?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnUrl } = await searchParams;
  return (
    <LoginForm returnUrl={typeof returnUrl === "string" ? returnUrl : null} />
  );
}
