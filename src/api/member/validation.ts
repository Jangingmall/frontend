import { z } from "zod";

/**
 * 회원·인증 응답 검증 스키마. (docs/api-contract.md "회원·인증" · docs/routing-and-auth.md §4)
 *
 * 전부 `.passthrough()` — BE가 필드를 더 줘도 안 깨진다. 단 **인증 도메인은 prod에서도
 * `parse` throw**한다(docs/data-layer.md §4.3) — `safeParse` 분기를 두지 않는다.
 *
 * `POST /login` · `POST /token/refresh` 응답은 현재 `{ accessToken }`만 가정한다(경우 B).
 * BE가 `user`를 함께 주면(경우 A) `accessTokenResponseDto`에 optional `user`를 더하고
 * 부팅·로그인의 `GET /me` 2단계를 1단계로 줄인다.
 */

const roleSchema = z.enum(["USER", "ARTISAN", "ADMIN"]);

export const accessTokenResponseDto = z
  .object({ accessToken: z.string().min(1) })
  .passthrough();

export const memberMeResponseDto = z
  .object({
    // ID는 Long 계약이라 정수만. (docs/api-contract.md §2.2)
    id: z.number().int(),
    name: z.string(),
    // 판매자는 ["USER", "ARTISAN"]. 최소 1개. (docs/api-contract.md §3)
    roles: z.array(roleSchema).min(1),
  })
  .passthrough();

export type AccessTokenResponseDto = z.infer<typeof accessTokenResponseDto>;
export type MemberMeResponseDto = z.infer<typeof memberMeResponseDto>;
