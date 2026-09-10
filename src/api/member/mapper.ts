import type { AuthUser } from "@/types/auth";

import type { MemberMeResponseDto } from "./validation";

/** `GET /api/member/me` DTO → FE 도메인 모델. 이미 camelCase라 좁히기만 한다. */
export function mapMemberMe(dto: MemberMeResponseDto): AuthUser {
  return { id: dto.id, name: dto.name, roles: [...dto.roles] };
}
