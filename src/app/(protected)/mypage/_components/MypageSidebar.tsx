"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * 마이페이지 공용 좌측 내비. Figma MY-6(비밀번호 재확인 게이트) 기준 8항목.
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
  "flex h-11 items-center px-4 text-body-m text-font-dark transition-colors";

function MypageSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="마이페이지 내비게이션" className="flex w-51 flex-col">
      {MYPAGE_NAV_ITEMS.map((item) => {
        if (item.disabled || !item.href) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              className={cn(ITEM_CLASS, "text-font-dark-weak")}
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
              "hover:bg-states-hover",
              active && "font-bold",
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
