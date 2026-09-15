/**
 * 카카오 소셜 로그인 원형 버튼. IA LI-1엔 있지만 이번 PR에선 **비활성**이다.
 *
 * BE는 카카오 OAuth2를 이미 구현·테스트했고(`docs/회원_구현_현황.md`), same-origin rewrite도
 * `/oauth2/*`까지 선반영했다(`next.config.ts`) — 그런데도 비활성인 이유는 가리킬 실제 백엔드
 * 도메인이 아직 없어서다(`API_BASE_URL`이 목업용 더미 값). 도메인이 정해지면 이 컴포넌트를
 * `<a href="/api/member/oauth2/kakao">`로 바꾸고 실제 브랜드 SVG로 교체하면 된다 — 지금은
 * 브랜드 아이콘 자산도 리포에 없어(디자인팀 SVG 미제공) 색상 placeholder로 자리만 잡는다.
 */
export function KakaoLoginButton() {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label="카카오로 로그인 (준비 중)"
      className="flex size-12 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-[#FEE500] text-caption text-font-dark opacity-60"
    >
      카카오
    </button>
  );
}
