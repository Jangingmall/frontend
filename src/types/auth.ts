/**
 * 사용자 역할. (docs/api-contract.md §3 · docs/routing-and-auth.md §4.1)
 * FE는 `user.role: Role` 단일 값으로 판단한다 — BE `MemberProfileResponse.role`이 단일
 * enum이라(판매자는 `"ARTISAN"` 하나) 배열이 아니다. `MemberRole`의 `authorities` 목록
 * (`ARTISAN` → `["ROLE_USER","ROLE_ARTISAN"]`)은 Spring Security 내부 권한 문자열일 뿐
 * 응답 DTO 필드로 노출되지 않는다.
 */
export type Role = "USER" | "ARTISAN" | "ADMIN";

/**
 * 화면·store·api가 공유하는 로그인 사용자 모델. `GET /api/member/me` 응답(그리고
 * `POST /api/member/login` 응답의 `member` 필드)을 정규화한 형태다.
 * (docs/routing-and-auth.md §4.1)
 */
export interface AuthUser {
  id: number;
  name: string;
  role: Role;
}
