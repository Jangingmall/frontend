/**
 * 네이버 소셜 가입 전폭 버튼(SU-1). 로그인 화면의 원형 아이콘 버튼(`NaverLoginButton`)과
 * 시각적으로 다른 variant라 컴포넌트는 재사용하지 않는다. 아이콘은 버튼 배경 위에 그대로
 * 얹히는 flat glyph라 `NaverLoginButton`의 원형 배지 아이콘과는 다른 asset —
 * Figma 노드(`1175:17145`)를 이미지로 직접 export해 그 path를 그대로 옮겼다(임의로 다시
 * 그리지 않는다는 원칙).
 *
 * 클릭 로직은 부모(`SignupMethodStep`)가 갖고 있다 — 이 컴포넌트는 아이콘·스타일만 책임진다.
 * 네이버는 실제 BE에 OAuth2 엔드포인트가 없지만(목업으로 흉내낸다), 그 사실은 여기서
 * 신경 쓸 게 아니라 `api/member/api.ts`의 `startMockOAuthLogin`이 다룬다.
 */
interface NaverSignupButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export function NaverSignupButton({
  onClick,
  loading = false,
}: NaverSignupButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading || undefined}
      className="flex h-11 w-full shrink-0 items-center gap-3 rounded-sm bg-[#03A94D] pl-5 text-sm font-bold text-font-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10.8484 8.56487L4.91659 0H0V16H5.15157V7.43815L11.0834 16H16V0H10.8484V8.56487Z"
          fill="white"
        />
      </svg>
      {loading ? "연결하는 중…" : "네이버로 빠르게 가입하기"}
    </button>
  );
}
