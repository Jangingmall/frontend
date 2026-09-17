import { EmptyState } from "@/components/common/empty-state";

import { AccountInfoTab } from "./_components/AccountInfoTab";
import { type AccountTab, AccountTabs } from "./_components/AccountTabs";
import { AddressesTab } from "./_components/AddressesTab";

interface AccountPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const VALID_TABS: readonly AccountTab[] = [
  "info",
  "addresses",
  "payment-methods",
];

function normalizeTab(value: string | string[] | undefined): AccountTab {
  const candidate = Array.isArray(value) ? value[0] : value;
  return VALID_TABS.includes(candidate as AccountTab)
    ? (candidate as AccountTab)
    : "info";
}

/**
 * 회원 정보 수정(`/mypage/account`, `tab=info|addresses|payment-methods`). 비밀번호
 * 재확인 게이트는 `account/layout.tsx`가 담당한다 — 여기 도달했다는 건 이미 통과했다는 뜻.
 */
export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const tab = normalizeTab(params.tab);

  return (
    <div>
      <AccountTabs activeTab={tab} />
      {tab === "info" && <AccountInfoTab />}
      {tab === "addresses" && <AddressesTab />}
      {tab === "payment-methods" && (
        <EmptyState
          title="결제수단 관리 기능은 준비 중입니다"
          description="빠른 시일 내에 준비하겠습니다."
        />
      )}
    </div>
  );
}
