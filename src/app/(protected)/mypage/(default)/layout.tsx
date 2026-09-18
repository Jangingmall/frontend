"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { MypageShell } from "@/app/(protected)/mypage/_components/MypageShell";
import { MypageSidebarSection } from "@/app/(protected)/mypage/_components/MypageSidebarSection";

/**
 * 마이페이지 일반 페이지 셸 — 8항목 사이드바 + "마이페이지" 제목(Figma MY-6 기준).
 * `(default)` route group이라 URL엔 반영되지 않는다. `/mypage/account`는 자체 셸
 * (`account/layout.tsx`)을 쓰므로 이 그룹 밖에 둔다(design.md 재검토 — 2026-09-17).
 *
 * `/mypage/orders`(Figma MY-1)만 콘텐츠 폭 cap을 풀어준다 — 실측 `order-card-group`이
 * 사이드바 옆 전체 폭(1116px)을 쓴다(`account/layout.tsx`가 `addresses` 탭에 이미 쓰는
 * `contentClassName` 분기와 같은 패턴, T-27 design.md §1). 나머지 형제 라우트는 기존
 * 660px cap을 그대로 유지한다.
 */
export default function MypageDefaultLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <MypageShell
      title={<h1 className="text-title-xl text-font-dark">마이페이지</h1>}
      sidebar={<MypageSidebarSection />}
      contentClassName={
        pathname === "/mypage/orders" ? "max-w-none" : undefined
      }
    >
      {children}
    </MypageShell>
  );
}
