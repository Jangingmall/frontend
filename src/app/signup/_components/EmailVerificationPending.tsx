"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { safeReturnUrl } from "@/lib/auth/return-url";
import { useRequestEmailVerificationMutation } from "@/queries/member/mutations";

export function EmailVerificationPending({
  email,
  returnUrl,
}: {
  email: string;
  returnUrl: string | null;
}) {
  const resend = useRequestEmailVerificationMutation();
  const [message, setMessage] = useState("");
  return (
    <section
      className="flex flex-col gap-6 text-center"
      aria-label="이메일 인증 안내"
    >
      <h2 className="text-title-l">이메일 인증 후 로그인해 주세요</h2>
      <p>{email}로 보낸 메일의 인증 링크를 눌러 주세요.</p>
      <p>가입 정보가 저장되었습니다. 인증이 끝나면 로그인할 수 있습니다.</p>
      <Button
        variant="outline"
        loading={resend.isPending}
        onClick={async () => {
          try {
            await resend.mutateAsync({ email });
            setMessage("인증 메일을 다시 보냈습니다. 스팸함도 확인해 주세요.");
          } catch {
            setMessage("메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
          }
        }}
      >
        인증 메일 재발송
      </Button>
      <Link
        href={
          `/login?returnUrl=${encodeURIComponent(safeReturnUrl(returnUrl, "/"))}` as Route
        }
      >
        로그인하기
      </Link>
      <p role="status">{message}</p>
    </section>
  );
}
