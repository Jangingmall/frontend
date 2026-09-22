"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { exchangeOAuthTicket } from "@/api/member/oauth";
import { SignupInfoForm } from "@/app/signup/_components/SignupInfoForm";
import { safeReturnUrl } from "@/lib/auth/return-url";
import { useAuthStore } from "@/stores/auth";
import type { OAuthProvider } from "@/types/auth";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const request = useRef<ReturnType<typeof exchangeOAuthTicket> | null>(null);
  const handled = useRef(false);
  const [error, setError] = useState(false);
  const [onboarding, setOnboarding] = useState<{
    provider: OAuthProvider;
    returnUrl: string;
  } | null>(null);
  useEffect(() => {
    // 부팅 refresh가 끝난 뒤 교환하여 새 세션을 이전 refresh 실패가 지우지 않게 한다.
    if (status === "loading") return;
    if (
      request.current === null &&
      status === "authenticated" &&
      !sessionStorage.getItem("oauth-provider")
    ) {
      router.replace(
        safeReturnUrl(sessionStorage.getItem("oauth-return"), "/") as Route,
      );
      return;
    }
    if (handled.current) return;
    let active = true;
    request.current ??= exchangeOAuthTicket();
    void request.current
      .then((result) => {
        if (!active) return;
        handled.current = true;
        const returnUrl = safeReturnUrl(
          sessionStorage.getItem("oauth-return"),
          "/",
        );
        if (result.outcome === "needsProfile") {
          const provider = sessionStorage.getItem("oauth-provider");
          if (provider !== "naver" && provider !== "kakao") {
            setError(true);
            return;
          }
          setOnboarding({ provider, returnUrl });
          return;
        }
        sessionStorage.removeItem("oauth-provider");
        useAuthStore.getState().setSession(result.accessToken, result.user);
        router.replace(returnUrl as Route);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [status, router]);
  return (
    <main className="mx-auto w-full max-w-[55.5rem] px-4 py-16">
      {error ? (
        <div role="alert">
          소셜 로그인 정보를 확인하지 못했습니다.{" "}
          <Link href="/login">다시 로그인하기</Link>
        </div>
      ) : onboarding ? (
        <SignupInfoForm
          returnUrl={onboarding.returnUrl}
          socialContext={{
            provider: onboarding.provider,
            suggestedEmail: null,
          }}
          onCancel={() => router.replace("/login")}
        />
      ) : (
        <p role="status">로그인 정보를 확인하고 있습니다.</p>
      )}
    </main>
  );
}
