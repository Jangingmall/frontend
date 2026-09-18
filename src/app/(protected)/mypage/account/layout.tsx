"use client";

import { useSearchParams } from "next/navigation";
import { type ReactNode, useState } from "react";

import { MypageShell } from "@/app/(protected)/mypage/_components/MypageShell";
import { MypageSidebarSection } from "@/app/(protected)/mypage/_components/MypageSidebarSection";
import { ErrorState } from "@/components/common/error-state";
import { ApiError } from "@/lib/http/api-error";
import { useMemberProfileQuery } from "@/queries/member/queries";

import { normalizeAccountTab } from "./_components/account-tabs";
import { AccountPageTitle } from "./_components/AccountPageTitle";
import { AccountSubNav } from "./_components/AccountSubNav";
import { PasswordReconfirmGate } from "./_components/PasswordReconfirmGate";

/**
 * 회원정보 수정 진입 게이트(Figma MY-6/MY-6-social) + 셸 분기.
 *
 * 게이트 통과 전에는 일반 마이페이지 셸(8항목 사이드바 + "마이페이지" 제목)을 그대로
 * 보여준다 — Figma MY-6이 실제로 이 셸 안에서 렌더된다(2026-09-17 `get_design_context`
 * 대조로 확정, 이전엔 메타데이터만 보고 놓쳤다). 통과 후에는 4항목 서브내비 + "회원 정보
 * 수정" 제목을 쓰는 전용 셸로 바뀐다 — 일반 사이드바를 대체하지, 안에 얹지 않는다.
 *
 * `verified`는 이 레이아웃 인스턴스가 살아있는 동안만 유지된다 — 다른 마이페이지 라우트로
 * 나갔다 돌아오면 이 레이아웃이 언마운트·재마운트되어 다시 확인을 요구한다(design.md §4).
 */
export default function MypageAccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [verified, setVerified] = useState(false);
  const profileQuery = useMemberProfileQuery();
  const searchParams = useSearchParams();
  const activeTab = normalizeAccountTab(searchParams.get("tab"));

  if (profileQuery.isPending) {
    return (
      <MypageShell
        title={<h1 className="text-title-xl text-font-dark">마이페이지</h1>}
        sidebar={<MypageSidebarSection />}
      >
        <output
          aria-live="polite"
          className="block py-16 text-center text-body-s"
        >
          불러오는 중…
        </output>
      </MypageShell>
    );
  }

  if (profileQuery.isError) {
    const error = profileQuery.error;
    return (
      <MypageShell
        title={<h1 className="text-title-xl text-font-dark">마이페이지</h1>}
        sidebar={<MypageSidebarSection />}
      >
        <ErrorState
          code={error instanceof ApiError ? error.code : undefined}
          status={error instanceof ApiError ? error.status : undefined}
          onRetry={() => void profileQuery.refetch()}
        />
      </MypageShell>
    );
  }

  if (!verified) {
    return (
      <MypageShell
        title={<h1 className="text-title-xl text-font-dark">마이페이지</h1>}
        sidebar={<MypageSidebarSection />}
      >
        <PasswordReconfirmGate
          email={profileQuery.data.email}
          authProvider={profileQuery.data.authProvider}
          onVerified={() => setVerified(true)}
        />
      </MypageShell>
    );
  }

  return (
    <MypageShell
      title={<AccountPageTitle />}
      sidebar={<AccountSubNav activeTab={activeTab} />}
      contentClassName={activeTab === "addresses" ? "max-w-none" : undefined}
    >
      {children}
    </MypageShell>
  );
}
