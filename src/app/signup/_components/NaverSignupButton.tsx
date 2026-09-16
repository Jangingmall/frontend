/**
 * 네이버 소셜 가입 전폭 버튼(SU-1). 로그인 화면의 원형 아이콘 버튼(`NaverLoginButton`)과
 * 시각적으로 다른 variant라 컴포넌트는 재사용하지 않는다. 아이콘은 버튼 배경 위에 그대로
 * 얹히는 flat glyph라 `NaverLoginButton`의 원형 배지 아이콘과는 다른 asset —
 * Figma 노드(`1175:17145`)를 이미지로 직접 export해 그 path를 그대로 옮겼다(design.md
 * §7-9: 임의로 다시 그리지 않는다는 원칙).
 *
 * IA엔 있지만 비활성 — BE에 네이버 OAuth2 엔드포인트 자체가 없다(T-17에서 이미 확인).
 */
export function NaverSignupButton() {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label="네이버로 가입 (준비 중)"
      className="flex h-11 w-full shrink-0 cursor-not-allowed items-center gap-3 rounded-sm bg-[#03A94D] pl-5 text-sm font-bold text-font-white opacity-60"
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
      네이버로 빠르게 가입하기
    </button>
  );
}
