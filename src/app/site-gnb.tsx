"use client";

import { Gnb } from "@/components/common/gnb";
import { useAuthStore } from "@/stores/auth";

/**
 * `Gnb`와 `stores/auth`를 잇는 접합부. (docs/architecture.md §6)
 *
 * `components/common/`은 Zustand store에 의존하지 않으므로, store를 읽는 코드는 이 파일처럼
 * `app/` 안에 둔다. 호출부가 루트 `layout.tsx` 하나뿐인 화면 조합 코드라 재사용 컴포넌트가
 * 아니라 여기(`app/auth-bootstrap.tsx`와 같은 자리)에 둔다.
 *
 * `AuthStatus`(`stores/auth.ts`)와 `Gnb`의 `authStatus` 리터럴 값이 동일해 캐스팅 없이 그대로
 * 넘어간다 — 타입을 이름으로 연결하지 않고 구조적으로만 맞춰 `Gnb`가 store 타입을 몰라도 되게
 * 한다.
 */
export function SiteGnb() {
  const status = useAuthStore((state) => state.status);
  return <Gnb authStatus={status} />;
}
