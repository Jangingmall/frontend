"use client";

import { useState } from "react";

import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/http/api-error";
import { useMemberProfileQuery } from "@/queries/member/queries";

import { PasswordChangeModal } from "./PasswordChangeModal";
import { ProfileEditModal } from "./ProfileEditModal";

/**
 * "내 정보" 탭. 이름·이메일(읽기 전용)·휴대전화를 표시하고, 수정은 두 개의 독립된
 * 모달(`ProfileEditModal`/`PasswordChangeModal`)로 연다 — design.md §7-8.
 */
function AccountInfoTab() {
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
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

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-title-s text-font-dark">내 정보</h2>
        <Button
          type="button"
          variant="outline"
          size="s"
          onClick={() => setEditOpen(true)}
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

      {profile.authProvider === "local" && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setPasswordOpen(true)}
        >
          비밀번호 변경
        </Button>
      )}

      <ProfileEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
      />
      <PasswordChangeModal open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  );
}

export { AccountInfoTab };
