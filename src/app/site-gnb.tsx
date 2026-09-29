"use client";

import { useMemo, useRef } from "react";

import { logout } from "@/api/member/api";
import { Gnb } from "@/components/common/gnb";
import { useDemoSession, useMockAccount } from "@/lib/demo-session";
import { toGnbCategories } from "@/lib/gnb-categories";
import { useCartQuery } from "@/queries/cart/queries";
import { useProductCategories } from "@/queries/products/queries";
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
/**
 * GNB 분류(메가패널·모바일 메뉴) — 백엔드 분류를 `Gnb`가 그리는 트리로 바꿔 넘긴다. 루트
 * layout이 서버에서 미리 채워(`HydrationBoundary`) 첫 렌더에 바로 나오고, 서버 조회가 실패했으면
 * (캐시에 실패는 실리지 않는다) 마운트 시 클라이언트가 다시 조회한다.
 */
function useGnbCategories() {
  const query = useProductCategories(true);
  const categories = useMemo(
    () => toGnbCategories(query.data ?? []),
    [query.data],
  );
  return {
    categories,
    // 이미 받은 데이터가 있으면 이후 조회가 실패해도 계속 보여준다.
    categoriesStatus: query.data
      ? ("ready" as const)
      : query.isError
        ? ("error" as const)
        : ("loading" as const),
    onCategoriesRetry: () => {
      void query.refetch();
    },
  };
}

/**
 * 모바일 메뉴의 로그인 상태 줄 — 사용자 이름과 로그아웃. 서버 세션 무효화가 실패해도(네트워크 등)
 * 클라이언트 세션은 반드시 정리한다: 사용자가 로그아웃을 눌렀는데 로그인 상태로 남으면 안 된다.
 */
export function useGnbSession() {
  const userName = useAuthStore((state) => state.user?.name);
  // 진행 중인 로그아웃이 있으면 다시 시작하지 않는다 — 연타가 서버에 여러 번 나가면 안 된다.
  const isLoggingOut = useRef(false);
  return {
    userName,
    onLogout: () => {
      if (isLoggingOut.current) return;
      isLoggingOut.current = true;
      void logout()
        .catch(() => undefined)
        .finally(() => {
          useAuthStore.getState().clear();
          isLoggingOut.current = false;
        });
    },
  };
}

type SiteNav = ReturnType<typeof useGnbCategories> &
  ReturnType<typeof useGnbSession>;

export function SiteGnb() {
  const nav: SiteNav = { ...useGnbCategories(), ...useGnbSession() };
  const status = useAuthStore((state) => state.status);
  const cartCount = usePurchasePreviewStore((state) => state.lines.length);
  const demo = useDemoSession();
  const mockAccount = useMockAccount();
  if (!mockAccount) return <LiveSiteGnb nav={nav} />;
  return (
    <>
      {demo && (
        <p role="status" className="bg-bg-default p-2 text-center text-body-s">
          네이버 로그인 시연 · 계정 및 거래는 실제 서버에 저장되지 않습니다.
        </p>
      )}
      <Gnb authStatus={status} cartCount={cartCount} {...nav} />
    </>
  );
}
function LiveSiteGnb({ nav }: { nav: SiteNav }) {
  const status = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.user?.id);
  const cart = useCartQuery(status !== "loading", String(userId ?? "guest"));
  return <Gnb authStatus={status} cartCount={cart.data?.totalCount} {...nav} />;
}
