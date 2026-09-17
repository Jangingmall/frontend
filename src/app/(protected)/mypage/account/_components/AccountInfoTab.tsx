"use client";

import { useState } from "react";

import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/http/api-error";
import { useMemberProfileQuery } from "@/queries/member/queries";

import { ProfileEditForm } from "./ProfileEditForm";

/**
 * "내 정보" 탭(Figma ID-1/ID-1-edit). 기본은 이름·이메일(읽기 전용)·휴대전화를 보여주는
 * 조회 화면이고, "회원 정보 수정" 버튼을 누르면 같은 자리에서 `ProfileEditForm`으로
 * 바뀐다 — 모달이 아니라 인라인 전환이다. 비밀번호 변경은 별도 내비 탭
 * (`AccountSubNav`/`PasswordChangeTab`)으로 완전히 분리되어 여기엔 없다.
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
        <h2 className="text-title-s text-font-dark">내 정보</h2>
        <Button
          type="button"
          variant="outline"
          size="s"
          onClick={() => setMode("edit")}
        >
          회원 정보 수정
        </Button>
      </div>

      <dl className="grid grid-cols-[5.625rem_1fr] gap-y-3 text-body-s">
        <dt className="text-font-dark-subtle">이름</dt>
        <dd className="text-font-dark">{profile.name}</dd>
        <dt className="text-font-dark-subtle">이메일</dt>
        <dd className="text-font-dark">{profile.email}</dd>
        <dt className="text-font-dark-subtle">휴대전화</dt>
        <dd className="text-font-dark">{profile.phone}</dd>
      </dl>
    </div>
  );
}

export { AccountInfoTab };
