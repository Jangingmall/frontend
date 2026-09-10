/**
 * 사용자 역할. (docs/api-contract.md §3 · docs/routing-and-auth.md §4.1)
 * FE는 `user.roles: Role[]` 배열로 판단한다(판매자는 `["USER", "ARTISAN"]`).
 */
export type Role = "USER" | "ARTISAN" | "ADMIN";
