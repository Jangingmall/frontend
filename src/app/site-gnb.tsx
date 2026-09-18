"use client";

import { Gnb } from "@/components/common/gnb";
import { publicEnv } from "@/lib/env";
import { useAuthStore } from "@/stores/auth";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";

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
 * `/login`도 GNB를 그대로 보여준다 — 팀 IA 시트 CM-1(글로벌 헤더) 비고엔 "LI-1·SU-1~3는 GNB
 * 없음"이라고 적혀 있지만, 실제 Figma(`[삼성가고싶어요] GUI` 파일, 로그인 프레임
 * `889:61144`)엔 `NavBar` 인스턴스가 포함돼 있어 IA 쪽이 스테일한 것으로 확인(2026-09-15).
 * 한 번 라우트 분기로 숨겼다가 Figma 확인 후 다시 제거함.
 */
export function SiteGnb() {
  const status = useAuthStore((state) => state.status);
  const cartCount = usePurchasePreviewStore((state) => state.lines.length);
  return (
    <Gnb
      authStatus={status}
      cartCount={publicEnv.apiMocking ? cartCount : undefined}
    />
  );
}
