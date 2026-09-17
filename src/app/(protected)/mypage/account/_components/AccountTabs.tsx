import type { Route } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type AccountTab = "info" | "addresses" | "payment-methods";

const TABS: { value: AccountTab; label: string }[] = [
  { value: "info", label: "내 정보" },
  { value: "addresses", label: "배송지" },
  { value: "payment-methods", label: "결제수단" },
];

/**
 * `/mypage/account` 탭 트리거. `activeTab`을 prop으로 받아 순수하게 렌더만 하므로
 * client hook이 필요 없다(부모 `page.tsx`가 이미 서버에서 `searchParams`를 읽어 넘긴다).
 */
function AccountTabs({ activeTab }: { activeTab: AccountTab }) {
  return (
    <div role="tablist" aria-label="회원 정보 수정 탭" className="flex gap-1">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={`/mypage/account?tab=${tab.value}` as Route}
          role="tab"
          aria-selected={activeTab === tab.value}
          className={cn(
            "flex h-11 items-center px-4 text-body-m",
            activeTab === tab.value
              ? "border-b-2 border-border-jade-fill font-bold text-font-dark"
              : "text-font-dark-weak",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export { AccountTabs };
