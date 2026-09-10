import { create } from "zustand";

import type { AuthUser } from "@/types/auth";

/**
 * 인증 세션 store. (docs/routing-and-auth.md §4.1)
 *
 * **persist 하지 않는다** — access token은 브라우저 메모리에만 둔다는 것이 요구사항이다
 * (LocalStorage 금지, §4). 새로고침 시 비므로 부팅 silent refresh(`app/auth-bootstrap.tsx`)가
 * 세션을 복원한다.
 */

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthState {
  /** `loading` = 부팅 복원 시도 중(미확정). */
  status: AuthStatus;
  accessToken: string | null;
  user: AuthUser | null;
  /** 로그인·부팅 복원 성공: 토큰+user 확보 → `authenticated`. */
  setSession: (accessToken: string, user: AuthUser) => void;
  /**
   * 401 자동 refresh 성공: access token만 교체한다. `status`·`user`는 유지하고
   * `GET /api/member/me`를 다시 부르지 않는다. (§4.1)
   */
  setAccessToken: (accessToken: string) => void;
  /** 로그아웃·부팅 복원 실패·refresh 실패: 초기화 → `anonymous`. */
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  accessToken: null,
  user: null,
  setSession: (accessToken, user) =>
    set({ status: "authenticated", accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ status: "anonymous", accessToken: null, user: null }),
}));

/**
 * 판매자 분기 자리. `(seller)` 가드·헤더의 판매자 메뉴가 이후 소비한다.
 * 판매자 계정은 `roles: ["USER", "ARTISAN"]`. (docs/api-contract.md §3)
 */
export const selectIsArtisan = (state: AuthState): boolean =>
  state.user?.roles.includes("ARTISAN") ?? false;

export const selectIsAuthenticated = (state: AuthState): boolean =>
  state.status === "authenticated";
