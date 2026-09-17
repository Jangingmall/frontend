"use client";

import { useState } from "react";

import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/http/api-error";
import { useMemberProfileQuery } from "@/queries/member/queries";

import { ProfileEditForm } from "./ProfileEditForm";
import { ProviderBadge } from "./ProviderBadge";

/**
 * "내 정보" 탭(Figma ID-1/ID-1-edit). 기본은 이름·이메일(읽기 전용)·휴대전화·간편로그인
 * (소셜 계정만)을 보여주는 조회 화면이고, "수정하기" 버튼을 누르면 같은 자리에서
 * `ProfileEditForm`으로 바뀐다 — 모달이 아니라 인라인 전환이다. 비밀번호 변경은 별도 내비 탭
 * (`AccountSubNav`/`PasswordChangeTab`)으로 완전히 분리되어 여기엔 없다.
 *
 * Figma엔 "마케팅 수신동의" 행도 있지만 회원 API 응답에 그 값 자체가 없어(validation.ts
 * `memberProfileResponseDto` 참고) 뺐다 — routing-and-auth.md §9 대시보드 적립금·구매등급과
 * 같은 종류의 정책·계약 공백.
 */
function AccountInfoTab() {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const profileQuery = useMemberProfileQuery();

  if (profileQuery.isPending) {
    return (
      <div className="space-y-3 py-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-60" />
        <Skeleton className="h-6 w-40" />
      </div>
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

  const profile = profileQuery.data;

  if (mode === "edit") {
    return (
      <ProfileEditForm
        profile={profile}
        onCancel={() => setMode("view")}
        onSuccess={() => setMode("view")}
      />
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-title-m text-font-dark">내 정보</h2>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => setMode("edit")}
        >
          수정하기
        </Button>
      </div>

      <dl className="grid grid-cols-[5.625rem_1fr] items-center gap-y-3 text-body-s">
        <dt className="text-body-s-b text-font-dark">이름</dt>
        <dd className="text-font-dark">{profile.name}</dd>
        <dt className="text-body-s-b text-font-dark">이메일</dt>
        <dd className="text-font-dark">{profile.email}</dd>
        <dt className="text-body-s-b text-font-dark">휴대전화</dt>
        <dd className="text-font-dark">{profile.phone}</dd>
        {profile.authProvider !== "local" && (
          <>
            <dt className="text-body-s-b text-font-dark">간편로그인</dt>
            <dd>
              <ProviderBadge provider={profile.authProvider} variant="circle" />
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}

export { AccountInfoTab };
