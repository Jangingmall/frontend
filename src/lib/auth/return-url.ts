/**
 * `/login?returnUrl=...`을 검증 없이 쓰면 open redirect 취약점이 된다.
 * (docs/routing-and-auth.md §6)
 *
 * 가드(`(protected)/layout.tsx`)가 만드는 `returnUrl`은 항상 내부 pathname이라 생성 쪽은
 * 검증이 필요 없다 — **소비하는 쪽**(로그인 성공 콜백, OAuth 콜백)에서만 검증한다.
 * 화이트리스트 prefix는 두지 않는다. 내부 경로면 어디든 복귀를 허용한다.
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
  if (!value.startsWith("/")) return fallback; // 상대 경로만
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback; // protocol-relative 차단
  if (value.includes("\\")) return fallback;
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(value)) return fallback; // "/https:..." 류
  return value;
}
