"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * 마이페이지 공용 좌측 내비. Figma MY-6(비밀번호 재확인 게이트) 기준 8항목 —
 * 활성 항목은 어두운 배경(`--components/button/black`)+굵은 흰 글씨, 비활성 항목은
 * 배경 없이 진한 글씨(회색 아님) + 가운데 정렬, 12px 패딩(2026-09-17 `get_design_context`
 * 직접 대조로 확정 — 이전 버전은 메타데이터만 보고 GnbNav 스타일을 임의로 가져다 썼다).
 *
 * 이 작업(회원정보 수정)이 마이페이지 최초 착수라, "회원 정보 수정"·"상품 문의" 둘만 실제
 * 라우트가 있다. 나머지 6항목은 각각 다른 작업(T-27/29/30/20/31)이 라우트를 채울 때까지
 * `disabled`로 둔다 — `GnbNav`가 목적지 없는 항목("장인관"·"기획전")을 처리하는 것과 같은
 * 패턴(같은 텍스트 스타일 유지, hover만 뺌).
 */
interface MypageNavItem {
  label: string;
  href?: Route;
  disabled?: boolean;
}

const MYPAGE_NAV_ITEMS: MypageNavItem[] = [
  { label: "주문 및 배송", disabled: true },
  { label: "취소 · 교환 · 환불", disabled: true },
  { label: "내가 쓴 후기", disabled: true },
  { label: "찜 목록", disabled: true },
  { label: "최근 본 상품", disabled: true },
  { label: "상품 문의", href: "/mypage/inquiries" as Route },
  { label: "회원 정보 수정", href: "/mypage/account" as Route },
  { label: "설정", disabled: true },
];

const ITEM_CLASS =
  "flex items-center justify-center rounded-xs p-3 text-body-m text-center transition-colors";

function MypageSidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="마이페이지 내비게이션"
      className="flex w-51 flex-col gap-1"
    >
      {MYPAGE_NAV_ITEMS.map((item) => {
        if (item.disabled || !item.href) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              className={cn(ITEM_CLASS, "text-font-dark")}
            >
              {item.label}
            </span>
          );
        }

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
