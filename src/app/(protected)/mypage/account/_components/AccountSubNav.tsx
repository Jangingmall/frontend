import type { Route } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { MemberProfile } from "@/types/member";

import type { AccountTab } from "./account-tabs";

/**
 * 회원정보 수정 전용 좌측 서브내비 — 일반 마이페이지 8항목 사이드바를 대체한다
 * (Figma ID-1/ID-1-edit/ID-2/ID-3 전부 동일하게 이 4항목을 쓴다, 2026-09-17
 * `get_design_context` 대조로 확정). "비밀번호 변경"은 버튼이 아니라 독립된 내비
 * 목적지다 — 이전 설계(모달)를 재검토 후 정정.
 *
 * 소셜 로그인 계정엔 "비밀번호 변경" 항목을 숨긴다(사용자 결정, 2026-09-18) —
 * Figma의 소셜 변형(ID-1-edit-social, node `1271:52944`)도 실제로는 이 항목을 그대로
 * 보여주고 `PasswordChangeTab`이 클릭 시 안내만 하지만, 비밀번호가 없는 계정에 진입
 * 가능한 죽은 탭을 두지 않기로 했다 — Figma 충실도보다 이 판단을 우선한다.
 */
const ACCOUNT_NAV_ITEMS: { value: AccountTab; label: string }[] = [
  { value: "info", label: "내 정보" },
  { value: "password", label: "비밀번호 변경" },
  { value: "addresses", label: "배송지" },
  { value: "payment-methods", label: "결제수단" },
];

const ITEM_CLASS =
  "flex items-center justify-start rounded-xs p-3 text-body-m text-left transition-colors";

interface AccountSubNavProps {
  activeTab: AccountTab;
  authProvider: MemberProfile["authProvider"];
}

function AccountSubNav({ activeTab, authProvider }: AccountSubNavProps) {
  const items = ACCOUNT_NAV_ITEMS.filter(
    (item) => item.value !== "password" || authProvider === "local",
  );
  return (
    <nav
      aria-label="회원 정보 수정 내비게이션"
      className="flex w-51 flex-col gap-1"
    >
      {items.map((item) => {
        const active = activeTab === item.value;
        return (
          <Link
            key={item.value}
            href={`/mypage/account?tab=${item.value}` as Route}
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

export { AccountSubNav };
