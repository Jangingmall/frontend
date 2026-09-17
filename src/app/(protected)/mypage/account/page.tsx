import { EmptyState } from "@/components/common/empty-state";

import { normalizeAccountTab } from "./_components/account-tabs";
import { AccountInfoTab } from "./_components/AccountInfoTab";
import { AddressesTab } from "./_components/AddressesTab";
import { PasswordChangeTab } from "./_components/PasswordChangeTab";

interface AccountPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 회원 정보 수정(`/mypage/account`, `tab=info|password|addresses|payment-methods`).
 * 비밀번호 재확인 게이트와 좌측 서브내비(`AccountSubNav`)는 `account/layout.tsx`가
 * 담당한다 — 여기 도달했다는 건 이미 통과했다는 뜻.
 */
export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const tab = normalizeAccountTab(params.tab);

  return (
    <div>
      {tab === "info" && <AccountInfoTab />}
      {tab === "password" && <PasswordChangeTab />}
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
