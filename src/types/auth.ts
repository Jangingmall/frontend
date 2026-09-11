/**
 * 사용자 역할. (docs/api-contract.md §3 · docs/routing-and-auth.md §4.1)
 * FE는 `user.roles: Role[]` 배열로 판단한다(판매자는 `["USER", "ARTISAN"]`).
 */
export type Role = "USER" | "ARTISAN" | "ADMIN";

/**
 * 화면·store·api가 공유하는 로그인 사용자 모델. `GET /api/member/me` 응답을
 * 정규화한 형태다. (docs/routing-and-auth.md §4.1)
 */
export interface AuthUser {
  id: number;
  name: string;
  roles: Role[];
}
