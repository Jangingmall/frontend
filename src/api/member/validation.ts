import { z } from "zod";

/**
 * 회원·인증 응답 검증 스키마. (docs/api-contract.md "회원·인증" · docs/routing-and-auth.md §4)
 *
 * 전부 `.passthrough()` — BE가 필드를 더 줘도 안 깨진다. 단 **인증 도메인은 prod에서도
 * `parse` throw**한다(docs/data-layer.md §4.3) — `safeParse` 분기를 두지 않는다.
 *
 * `POST /login` 응답엔 `member`(경우 A)가 이미 포함된다 — BE 레포(`Jangingmall/backend`)
 * `MemberLoginResponse`를 직접 대조해 확인. `GET /me`·로그인 응답의 `member`가 같은 모양이라
 * `memberProfileResponseDto` 하나로 공유한다. `POST /token/refresh`는 `member` 없이
 * `{ accessToken }`만 주므로(경우 B 그대로) `accessTokenResponseDto`를 그대로 쓴다.
 */

const roleSchema = z.enum(["USER", "ARTISAN", "ADMIN"]);

export const accessTokenResponseDto = z
  .object({ accessToken: z.string().min(1) })
  .passthrough();

/**
 * 로그인 방식. **BE 계약 미확정 — 이 작업에서 가정 추가**(design.md 참고). `MemberProfileResponse`엔
 * 아직 이 필드가 없다 — DB(`MemberSocialAccount`)엔 연동 정보가 있으나 응답에 노출되지 않아
 * 필드 추가를 요청한 상태. `null`은 `LOCAL`과 동일하게 취급한다.
 */
const authProviderSchema = z.enum(["LOCAL", "NAVER", "KAKAO"]).nullable();

export const memberProfileResponseDto = z
  .object({
    // ID는 Long 계약이라 정수만. (docs/api-contract.md §2.2)
    memberId: z.number().int(),
    email: z.string(),
    name: z.string(),
    // BE `Member.nickname`은 항상 채워지는 값이 아니고 `MemberSession`에 null로 넘기는
    // 생성자 오버로드가 있어 방어적으로 nullable 처리.
    nickname: z.string().nullable(),
    // 판매자는 "ARTISAN" 단일 값. 배열이 아니다. (docs/api-contract.md §3)
    role: roleSchema,
    profileImageUrl: z.string().nullable(),
    // 회원가입이 필수로 받는 값이라 항상 존재한다고 가정(BE `Member.phone` non-null 컬럼).
    phone: z.string(),
    authProvider: authProviderSchema,
  })
  .passthrough();

export const loginResponseDto = z
  .object({
    accessToken: z.string().min(1),
    member: memberProfileResponseDto,
  })
  .passthrough();

export type AccessTokenResponseDto = z.infer<typeof accessTokenResponseDto>;
export type MemberProfileResponseDto = z.infer<typeof memberProfileResponseDto>;
export type LoginResponseDto = z.infer<typeof loginResponseDto>;

/**
 * `POST /api/member/email-verifications` 응답. **placeholder 계약**(design.md §0.1·§7-2) —
 * 실제 BE는 지금 이메일 인증 코드 API가 없고(재전송 전용 + magic-link 방식) 코드 입력 방식으로
 * 바꿀 예정이라고만 전달받았다. BE가 실제로 배포하면 이 스키마를 다시 대조해야 한다.
 */
export const emailVerificationResponseDto = z
  .object({ expiresInSeconds: z.number().int().positive() })
  .passthrough();

/**
 * `POST /api/member/signup` 응답. **BE에 변경을 요청한 형태**(design.md §0.2) — 로그인과
 * 동일하게 세션(`accessToken`+`member`)을 받는다고 가정한다. 실제로 지금 BE가 주는 건
 * `{ memberId, email, status }`뿐이라(세션 없음) BE가 이 변경을 배포하기 전엔 실제 서버로
 * 가입할 때마다 이 스키마의 `parse`가 실패한다 — 알고 진행하는 배포 순서 리스크.
 */
export const signupResponseDto = loginResponseDto;

export type EmailVerificationResponseDto = z.infer<
  typeof emailVerificationResponseDto
>;
export type SignupResponseDto = z.infer<typeof signupResponseDto>;

/**
 * `POST /api/member/oauth2/complete-profile` 응답. `signup`/`login`과 달리 **중첩된
 * `member` 객체가 아니라 평면 구조**다 — BE 레포(`Jangingmall/backend`)
 * `OAuthController.CompletionResponse(memberId, email, role, accessToken)`를 직접
 * 대조해 확인. `name`은 응답에 없다 — 이 엔드포인트를 부르는 시점엔 폼에서 막 입력받은
 * 이름을 이미 갖고 있으므로(`SignupInfoForm.onSubmit`), 서버가 굳이 돌려줄 필요가 없는
 * 값이다.
 *
 * 실제 요청 바디는 `{ name, phone, agreements }`뿐이고(`email`·`provider` 없음), 신원은
 * `oauthOnboarding` 쿠키로 서버가 식별한다 — 목업은 리다이렉트·쿠키 체인 자체를 흉내낼
 * 수 없어(§`startMockOAuthLogin` 주석) 클라이언트가 `provider`·`email`을 명시적으로
 * 보내는 더 단순한 계약을 쓴다. 실제 연동 시 요청 바디 계약도 함께 맞춰야 한다 —
 * `docs/api-contract.md` §9 확인.
 */
export const oauthCompleteProfileResponseDto = z
  .object({
    memberId: z.number().int(),
    email: z.string(),
    role: roleSchema,
    accessToken: z.string().min(1),
  })
  .passthrough();

export type OAuthCompleteProfileResponseDto = z.infer<
  typeof oauthCompleteProfileResponseDto
>;

/**
 * 배송지 응답. `GET|POST /api/member/me/addresses`, `PATCH .../{addressId}` 공유 —
 * BE `AddressData(addressId, recipientName, phone, zipCode, address1, address2, isDefault)`를
 * 직접 대조해 확정한 필드명.
 */
export const addressResponseDto = z
  .object({
    addressId: z.number().int(),
    recipientName: z.string(),
    phone: z.string(),
    zipCode: z.string(),
    address1: z.string(),
    address2: z.string(),
    isDefault: z.boolean(),
  })
  .passthrough();

/** `GET /api/member/me/addresses` 목록 응답 — BE가 `PagedResponse` 없이 배열을 그대로 준다. */
export const addressListResponseDto = z.array(addressResponseDto);

export type AddressResponseDto = z.infer<typeof addressResponseDto>;
export type AddressListResponseDto = z.infer<typeof addressListResponseDto>;
