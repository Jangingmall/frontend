import type { ReactNode } from "react";

import { MypageSidebar } from "./_components/MypageSidebar";

/**
 * 마이페이지 공용 셸. `(protected)/layout.tsx`(로그인 가드) 안쪽에서 좌측 내비 + 콘텐츠
 * 슬롯을 조립한다. 로그인 가드는 상위 레이아웃이 이미 처리하므로 여기선 신경 쓰지 않는다.
 */
export default function MypageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-360 gap-8 px-8 py-12">
      <MypageSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
