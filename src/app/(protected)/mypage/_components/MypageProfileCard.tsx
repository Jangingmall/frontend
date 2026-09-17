"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useMemberProfileQuery } from "@/queries/member/queries";

/**
 * 마이페이지 좌측 사이드바 위 프로필 요약 카드(Figma MY-6). 일반 8항목 사이드바
 * (`MypageSidebar`)와만 같이 쓰인다 — 회원정보 수정 전용 서브내비(`AccountSubNav`)
 * 프레임(ID-1 등)엔 이 카드가 없다(2026-09-17 `get_design_context` 대조로 확인).
 *
 * Figma엔 "구매 등급" 배지·적립금 금액도 있지만, 적립금·구매등급 제도 자체가 정책
 * 미확정이라(routing-and-auth.md §9) 이름만 보여주고 두 항목은 뺀다.
 */
function MypageProfileCard() {
  const profileQuery = useMemberProfileQuery();

  if (profileQuery.isPending) {
    return (
      <div className="w-51 rounded-sm bg-fill-neutral-weak p-4">
        <Skeleton className="h-6 w-24" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return null;
  }

  return (
    <div className="w-51 rounded-sm bg-fill-neutral-weak p-4">
      <p className="text-title-m text-font-dark">{profileQuery.data.name}님</p>
    </div>
  );
}

export { MypageProfileCard };
