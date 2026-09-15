/**
 * `/login?returnUrl=...`을 검증 없이 쓰면 open redirect 취약점이 된다.
 * (docs/routing-and-auth.md §6)
 *
 * 가드(`(protected)/layout.tsx`)가 만드는 `returnUrl`은 항상 내부 pathname이라 생성 쪽은
 * 검증이 필요 없다 — **소비하는 쪽**(로그인 성공 콜백, OAuth 콜백)에서만 검증한다.
 * 화이트리스트 prefix는 두지 않는다. 내부 경로면 어디든 복귀를 허용한다.
 *
 * 디코딩된 값에 제어문자(인코딩된 CR·LF 등)가 섞여 있어도 거부한다(2026-09-15, PR 리뷰) —
 * 지금은 클라이언트 `router.replace()`에만 쓰이지만, 이 함수 자체가 "OAuth 콜백에서도
 * 검증"을 전제로 하고 있어 나중에 서버 쪽 리다이렉트(`Location` 헤더)에 재사용될 수도 있다.
 * 그때 가서 따로 손보게 두지 않고 지금부터 막아 둔다.
 */
export function safeReturnUrl(
  raw: string | null,
  fallback = "/mypage",
): string {
  if (!raw) return fallback;
  let value: string;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  if (/[\x00-\x1f\x7f]/.test(value)) return fallback; // 인코딩된 제어문자(개행 등) 차단
  if (!value.startsWith("/")) return fallback; // 상대 경로만
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback; // protocol-relative 차단
  if (value.includes("\\")) return fallback;
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(value)) return fallback; // "/https:..." 류
  return value;
}
