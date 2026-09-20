import type { ReactNode } from "react";

import { MypageShell } from "@/app/(protected)/mypage/_components/MypageShell";
import { MypageSidebarSection } from "@/app/(protected)/mypage/_components/MypageSidebarSection";

/**
 * `/mypage/reviews`(Figma MY-3) 전용 셸 — 8항목 사이드바는 `(default)` 형제 라우트와
 * 같지만, 콘텐츠 폭 cap만 다르다("Main container" 실측 1116px, 사이드바 옆 전체 폭).
 * `orders/(list)/layout.tsx`와 정확히 같은 이유로 `(default)` 그룹 밖에 별도 Server
 * 레이아웃으로 둔다 — pathname 분기 하나 때문에 형제 레이아웃 전체를 Client Component로
 * 만들 필요가 없다(`docs/conventions.md` §6 최소 Client 경계 원칙).
 */
export default function MypageReviewsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <MypageShell
      title={<h1 className="text-title-xl text-font-dark">마이페이지</h1>}
      sidebar={<MypageSidebarSection />}
      contentClassName="max-w-none"
    >
      {children}
    </MypageShell>
  );
}
