import type { AuthUser } from "@/types/auth";

import type { MemberProfileResponseDto } from "./validation";

/**
 * `GET /api/member/me` DTO(그리고 로그인 응답의 `member` 필드 — 같은 모양) → FE 도메인 모델.
 * `memberId` → `id`로 이름을 맞추고 화면이 실제로 쓰는 `id`·`name`·`role`만 남긴다
 * (`email`·`nickname`·`profileImageUrl`은 아직 소비하는 화면이 없다 — docs/architecture.md
 * "실제 소비하는 슬라이스만 선언" 원칙).
 */
export function mapMemberProfile(dto: MemberProfileResponseDto): AuthUser {
  return { id: dto.memberId, name: dto.name, role: dto.role };
}
