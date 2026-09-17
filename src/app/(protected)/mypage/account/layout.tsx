"use client";

import { type ReactNode, useState } from "react";

import { ErrorState } from "@/components/common/error-state";
import { ApiError } from "@/lib/http/api-error";
import { useMemberProfileQuery } from "@/queries/member/queries";

import { PasswordReconfirmGate } from "./_components/PasswordReconfirmGate";

/**
 * 회원정보 수정 진입 게이트(Figma MY-6/MY-6-social). `verified`는 이 레이아웃 인스턴스가
 * 살아있는 동안만 유지된다 — 다른 마이페이지 라우트로 나갔다 돌아오면 이 레이아웃이
 * 언마운트·재마운트되어 다시 확인을 요구한다(의도된 동작, design.md §4).
 */
export default function MypageAccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [verified, setVerified] = useState(false);
  const profileQuery = useMemberProfileQuery();

  if (profileQuery.isPending) {
    return (
      <output
        aria-live="polite"
        className="block py-16 text-center text-body-s"
      >
        불러오는 중…
      </output>
    );
  }

  if (profileQuery.isError) {
    const error = profileQuery.error;
    return (
      <ErrorState
        code={error instanceof ApiError ? error.code : undefined}
        status={error instanceof ApiError ? error.status : undefined}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  if (!verified) {
    return (
      <PasswordReconfirmGate
        email={profileQuery.data.email}
        authProvider={profileQuery.data.authProvider}
        onVerified={() => setVerified(true)}
      />
    );
  }

  return <>{children}</>;
}
