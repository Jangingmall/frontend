/**
 * 카카오 소셜 로그인 원형 버튼. Figma(`[삼성가고싶어요] GUI` 파일, 로그인 프레임
 * `889:61144` → node `889:61153`)에서 실제 아이콘 SVG를 그대로 가져왔다 — 브랜드 로고를
 * 임의로 그리지 않는다는 원칙(docs/architecture.md)을 지키면서도 플레이스홀더보다 정확하다.
 *
 * 실제 백엔드 도메인이 아직 없어(`API_BASE_URL`이 목업용 더미 값) 진짜 리다이렉트로는 못
 * 붙이지만, 클릭하면 목업 OAuth 흐름으로 연결된다 — 실제 판정 로직은
 * `/signup`(`SignupFlow`)에 있고, 이 버튼은 `provider` 쿼리와 함께 그리로 navigate만 한다.
 * 도메인이 정해지면 이 버튼의 `onClick`을 실제 리다이렉트 링크로 바꾼다 — 정확한 시작 경로는
 * 아직 미확정이니 `api/member/api.ts`의 `startMockOAuthLogin` 주석과
 * `docs/api-contract.md` §9 "OAuth 로그인 시작 경로 불일치"를 먼저 확인한다.
 */
interface KakaoLoginButtonProps {
  onClick: () => void;
}

export function KakaoLoginButton({ onClick }: KakaoLoginButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="카카오로 로그인"
      className="size-12 shrink-0 overflow-hidden rounded-full"
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
