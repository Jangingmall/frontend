import type { Metadata } from "next";

import { SignupCompletePanel } from "./_components/SignupCompletePanel";

export const metadata: Metadata = {
  title: "회원가입 완료 | 장인몰",
  robots: { index: false, follow: false },
};

interface SignupCompletePageProps {
  searchParams: Promise<{ returnUrl?: string | string[] }>;
}

export default async function SignupCompletePage({
  searchParams,
}: SignupCompletePageProps) {
  const { returnUrl } = await searchParams;
  return (
    <SignupCompletePanel
      returnUrl={typeof returnUrl === "string" ? returnUrl : null}
    />
  );
}
