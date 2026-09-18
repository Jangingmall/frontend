"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * 마이페이지 공용 좌측 내비. Figma MY-6(비밀번호 재확인 게이트) 기준 8항목 —
 * 활성 항목은 어두운 배경(`--components/button/black`)+굵은 흰 글씨, 비활성 항목은
 * 배경 없이 진한 글씨(회색 아님) + 좌측 정렬, 12px 패딩(2026-09-17 `get_design_context`
 * 직접 대조로 확정 — 이전 버전은 메타데이터만 보고 GnbNav 스타일을 임의로 가져다 썼다).
 *
 * "회원 정보 수정"·"상품 문의" 둘만 실제 화면이 있고, 나머지 6항목은 각 화면의 설계·구현이
 * 아직 없어 `상품 문의`와 같은 "준비 중" placeholder 페이지로 연결한다.
 */
interface MypageNavItem {
  label: string;
  href: Route;
}

const MYPAGE_NAV_ITEMS: MypageNavItem[] = [
  { label: "주문 및 배송", href: "/mypage/orders" as Route },
  {
    label: "취소 · 교환 · 환불",
    href: "/mypage/orders/cancellations" as Route,
  },
  { label: "내가 쓴 후기", href: "/mypage/reviews" as Route },
  { label: "찜 목록", href: "/mypage/wishlist" as Route },
  { label: "최근 본 상품", href: "/mypage/recent" as Route },
  { label: "상품 문의", href: "/mypage/inquiries" as Route },
  { label: "회원 정보 수정", href: "/mypage/account" as Route },
  { label: "설정", href: "/mypage/settings" as Route },
];

const ITEM_CLASS =
  "flex items-center justify-start rounded-xs p-3 text-body-m text-left transition-colors";

function MypageSidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="마이페이지 내비게이션"
      className="flex w-51 flex-col gap-1"
    >
      {MYPAGE_NAV_ITEMS.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              ITEM_CLASS,
              active
                ? "bg-fill-neutral-impact font-bold text-font-white"
                : "text-font-dark hover:bg-states-hover",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export { MypageSidebar };
