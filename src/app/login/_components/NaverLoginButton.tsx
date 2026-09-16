/**
 * 네이버 소셜 로그인 원형 버튼. Figma(`[삼성가고싶어요] GUI` 파일, 로그인 프레임
 * `889:61144` → node `889:61151`)에서 실제 아이콘 SVG를 그대로 가져왔다 — 브랜드 로고를
 * 임의로 그리지 않는다는 원칙(docs/architecture.md)을 지키면서도 플레이스홀더보다 정확하다.
 *
 * BE에 네이버 OAuth2 엔드포인트 자체가 없지만(`docs/api-contract.md` §9), 클릭하면 목업
 * OAuth 흐름으로 연결된다 — 실제 판정 로직은 `/signup`(`SignupFlow`)에 있고, 이 버튼은
 * `provider` 쿼리와 함께 그리로 navigate만 한다.
 */
interface NaverLoginButtonProps {
  onClick: () => void;
}

export function NaverLoginButton({ onClick }: NaverLoginButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="네이버로 로그인"
      className="size-12 shrink-0 overflow-hidden rounded-full"
    >
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="24" fill="#03A94D" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M27.2045 24.6355L20.5312 15H15V33H20.7955V23.3679L27.4688 33H33V15H27.2045V24.6355Z"
          fill="white"
        />
      </svg>
    </button>
  );
}
