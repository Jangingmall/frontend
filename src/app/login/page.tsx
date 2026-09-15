import type { Metadata } from "next";

import { LoginForm } from "./_components/LoginForm";

export const metadata: Metadata = {
  title: "로그인 | 장인몰",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ returnUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnUrl } = await searchParams;
  return <LoginForm returnUrl={returnUrl ?? null} />;
}
