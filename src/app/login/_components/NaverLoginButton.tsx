/**
 * 네이버 소셜 로그인 원형 버튼. Figma(`[삼성가고싶어요] GUI` 파일, 로그인 프레임
 * `889:61144` → node `889:61151`)에서 실제 아이콘 SVG를 그대로 가져왔다 — 브랜드 로고를
 * 임의로 그리지 않는다는 원칙(docs/architecture.md)을 지키면서도 플레이스홀더보다 정확하다.
 *
 * IA엔 있지만 이번 PR에선 **비활성**이다. BE에 네이버 OAuth2 엔드포인트 자체가 없다
 * (`docs/회원_구현_현황.md`, `PHASE2-2_인증_정책_계약서.md` 모두 카카오·구글만 명시) — IA의
 * "네이버·카카오만(구글 제외)" 확정 메모가 실제 엔지니어링 현실과 어긋난다. PM에게 별도 전달
 * 대상이고, BE가 네이버를 추가하기 전까지는 연결할 곳 자체가 없어 비활성으로만 둔다.
 */
export function NaverLoginButton() {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label="네이버로 로그인 (준비 중)"
      className="size-12 shrink-0 cursor-not-allowed overflow-hidden rounded-full opacity-60"
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
