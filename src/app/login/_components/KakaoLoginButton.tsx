/**
 * 카카오 소셜 로그인 원형 버튼. Figma(`[삼성가고싶어요] GUI` 파일, 로그인 프레임
 * `889:61144` → node `889:61153`)에서 실제 아이콘 SVG를 그대로 가져왔다 — 브랜드 로고를
 * 임의로 그리지 않는다는 원칙(docs/architecture.md)을 지키면서도 플레이스홀더보다 정확하다.
 *
 * BE는 카카오 OAuth2를 이미 구현·테스트했고(`docs/회원_구현_현황.md`), same-origin rewrite도
 * `/oauth2/*`까지 선반영했다(`next.config.ts`) — 그런데도 비활성인 이유는 가리킬 실제 백엔드
 * 도메인이 아직 없어서다(`API_BASE_URL`이 목업용 더미 값). 도메인이 정해지면 `disabled`만
 * 떼고 `<a href="/api/member/oauth2/kakao">`로 바꾸면 된다.
 */
export function KakaoLoginButton() {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label="카카오로 로그인 (준비 중)"
      className="size-12 shrink-0 cursor-not-allowed overflow-hidden rounded-full opacity-60"
    >
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="24" fill="#FEE500" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24 15.9453C19.029 15.9453 15 19.0743 15 22.9343C15 25.3333 16.558 27.4503 18.932 28.7093L17.933 32.3753C17.845 32.7003 18.213 32.9583 18.496 32.7703L22.873 29.8663C23.243 29.9023 23.618 29.9223 24 29.9223C28.97 29.9223 33 26.7933 33 22.9343C33 19.0743 28.97 15.9453 24 15.9453Z"
          fill="black"
          fillOpacity="0.902"
        />
      </svg>
    </button>
  );
}
