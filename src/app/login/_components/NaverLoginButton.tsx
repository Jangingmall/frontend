/** 네이버 로그인 버튼. 실제 연동 전에는 비활성화한다. */
interface NaverLoginButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function NaverLoginButton({
  onClick,
  disabled = false,
}: NaverLoginButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "네이버 로그인은 준비 중입니다." : undefined}
      aria-label="네이버로 로그인"
      className="size-12 shrink-0 overflow-hidden rounded-full disabled:cursor-not-allowed disabled:opacity-60"
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
