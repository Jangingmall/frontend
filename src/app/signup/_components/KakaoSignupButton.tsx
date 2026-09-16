/**
 * 카카오 소셜 가입 전폭 버튼(SU-1). 로그인 화면의 원형 아이콘 버튼(`KakaoLoginButton`)과
 * 시각적으로 다른 variant라 컴포넌트는 재사용하지 않는다. 아이콘은 버튼 배경 위에 그대로
 * 얹히는 flat glyph라 `KakaoLoginButton`의 원형 배지 아이콘과는 다른 asset —
 * Figma 노드(`1175:17149`)를 이미지로 직접 export해 그 path를 그대로 옮겼다(임의로 다시
 * 그리지 않는다는 원칙).
 *
 * 클릭 로직은 부모(`SignupMethodStep`)가 갖고 있다 — 이 컴포넌트는 아이콘·스타일만 책임진다.
 */
interface KakaoSignupButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export function KakaoSignupButton({
  onClick,
  loading = false,
}: KakaoSignupButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading || undefined}
      className="flex h-11 w-full shrink-0 items-center gap-3 rounded-sm bg-[#FEE500] pl-5 text-sm font-bold text-black/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg
        width="19"
        height="17"
        viewBox="0 0 19 17"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.95217 0C4.95498 0 0 3.14549 0 7.02583C0 9.43748 2.47095 11.5656 4.85746 12.8313L3.8532 16.5166C3.76474 16.8433 4.13468 17.1027 4.41917 16.9137L8.81923 13.9944C9.19118 14.0306 9.56816 14.0507 9.95217 14.0507C14.9484 14.0507 18.9996 10.9052 18.9996 7.02583C18.9996 3.14549 14.9484 0 9.95217 0Z"
          fill="black"
          fillOpacity="0.902"
        />
      </svg>
      {loading ? "연결하는 중…" : "카카오톡으로 빠르게 가입하기"}
    </button>
  );
}
