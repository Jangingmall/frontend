import type { Role } from "@/types/auth";

/**
 * Mock 전용 "현재 로그인된 신원". `"anonymous"`는 로그인 이력이 없거나 로그아웃한 상태 —
 * 기본값이다. `handlers.ts`의 `/token/refresh`·`/me`가 이 값을 읽어 응답을 결정하고,
 * `/login`(성공)·`/logout`은 이 값을 갱신한다. `app/mock-identity-switcher.tsx`("리모컨")도
 * 같은 값을 직접 읽고 쓴다.
 *
 * 실제 BE의 refresh-token(Set-Cookie)을 `localStorage`로 흉내 낸 것이다.
 * `docs/routing-and-auth.md` §4의 "access token은 LocalStorage 금지"와는 무관하다 —
 * 여기 담는 건 진짜 토큰이 아니라 "어떤 mock 유저로 로그인했는지"를 가리키는 문자열 키일
 * 뿐이고, `publicEnv.apiMocking`이 꺼진 실제 빌드에선 이 모듈 자체가 로드되지 않는다.
 *
 * **기본값이 "anonymous"인 게 핵심이다** — 예전엔 `/token/refresh`가 무조건 성공해서
 * 로그인한 적 없는 새 브라우저 세션(E2E 포함)도 항상 authenticated로 부팅됐다. 그 상태로는
 * `/login`의 "이미 인증된 사용자는 내보낸다" 가드(§5.5-보완)를 테스트할 방법이 없었다
 * (2026-09-15, 사용자 확인 후 변경).
 */
export type MockIdentity = Role | "anonymous";

const MOCK_IDENTITY_KEY = "midam:mockIdentity";

const VALID_IDENTITIES: readonly MockIdentity[] = [
  "anonymous",
  "USER",
  "ARTISAN",
  "ADMIN",
];

function isMockIdentity(value: string | null): value is MockIdentity {
  return (
    value !== null && (VALID_IDENTITIES as readonly string[]).includes(value)
  );
}

export function getMockIdentity(): MockIdentity {
  const raw = localStorage.getItem(MOCK_IDENTITY_KEY);
  return isMockIdentity(raw) ? raw : "anonymous";
}

export function setMockIdentity(identity: MockIdentity): void {
  localStorage.setItem(MOCK_IDENTITY_KEY, identity);
}
