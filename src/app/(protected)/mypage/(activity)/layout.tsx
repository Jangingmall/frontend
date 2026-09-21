import type { ReactNode } from "react";

import { MypageShell } from "@/app/(protected)/mypage/_components/MypageShell";
import { MypageSidebarSection } from "@/app/(protected)/mypage/_components/MypageSidebarSection";

/**
 * `/mypage/wishlist`(Figma MY-4)·`/mypage/recent`(Figma MY-5) 전용 셸 — 8항목 사이드바는
 * `(default)` 형제 라우트와 같지만, 콘텐츠 폭 cap만 다르다(4열 카드 그리드가 사이드바 옆
 * 전체 폭을 쓴다 — `reviews/layout.tsx`·`orders/(list)/layout.tsx`와 같은 이유).
 */
export default function MypageActivityLayout({
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
