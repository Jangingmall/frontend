import type { ReactNode } from "react";

import { MypageShell } from "@/app/(protected)/mypage/_components/MypageShell";
import { MypageSidebarSection } from "@/app/(protected)/mypage/_components/MypageSidebarSection";

/**
 * 마이페이지 일반 페이지 셸 — 8항목 사이드바 + "마이페이지" 제목(Figma MY-6 기준).
 * `(default)` route group이라 URL엔 반영되지 않는다. `/mypage/account`는 자체 셸
 * (`account/layout.tsx`)을, `/mypage/orders`는 콘텐츠 폭 cap이 달라 자체 셸
 * (`orders/layout.tsx`)을 각각 쓰므로 이 그룹 밖에 둔다.
 */
export default function MypageDefaultLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <MypageShell
      title={<h1 className="text-title-xl text-font-dark">마이페이지</h1>}
      sidebar={<MypageSidebarSection />}
    >
      {children}
    </MypageShell>
  );
}
