import type { Metadata } from "next";

import { SignupFlow } from "./_components/SignupFlow";

export const metadata: Metadata = {
  title: "회원가입 | 장인몰",
  robots: { index: false, follow: false },
};

interface SignupPageProps {
  // LoginPage와 동일한 이유로 string[] 가능성을 방어한다(§`app/login/page.tsx`).
  searchParams: Promise<{ returnUrl?: string | string[] }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { returnUrl } = await searchParams;
  return (
    <SignupFlow returnUrl={typeof returnUrl === "string" ? returnUrl : null} />
  );
}
