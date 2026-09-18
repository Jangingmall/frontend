import type { ReactNode } from "react";

import { MypageShell } from "@/app/(protected)/mypage/_components/MypageShell";
import { MypageSidebarSection } from "@/app/(protected)/mypage/_components/MypageSidebarSection";

/**
 * `/mypage/orders`(Figma MY-1) 전용 셸 — 8항목 사이드바는 `(default)` 형제 라우트와
 * 같지만, 콘텐츠 폭 cap만 다르다(실측 `order-card-group`이 사이드바 옆 전체 폭(1116px)을
 * 쓴다, T-27 design.md §1). `(default)` route group 안에 두고 `usePathname()`으로 분기하는
 * 대신 이 라우트만 별도 Server 레이아웃으로 분리했다 — pathname 분기 하나 때문에 형제
 * 레이아웃 전체를 Client Component로 만들 필요가 없다(Codex 리뷰 지적, `docs/conventions.md`
 * §6 최소 Client 경계 원칙). `account/layout.tsx`처럼 group 없이 자기 URL 세그먼트로 둔다.
 */
export default function MypageOrdersLayout({
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
