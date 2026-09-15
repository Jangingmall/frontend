"use client";

import { usePathname } from "next/navigation";

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
 *
 * `/login`에서는 GNB를 숨긴다(docs/routing-and-auth.md §1 — "LI-1·SU-1~3는 GNB 없음"). 루트
 * layout이 `SiteGnb`를 무조건 렌더링해 라우트 분기가 없으므로 여기서 pathname으로 최소
 * 분기한다. `/signup`류는 아직 라우트가 없어 이번엔 조건에 안 넣는다 — 생기는 시점에 추가.
 */
export function SiteGnb() {
  const pathname = usePathname();
  const status = useAuthStore((state) => state.status);
  if (pathname === "/login") return null;
  return <Gnb authStatus={status} />;
}
