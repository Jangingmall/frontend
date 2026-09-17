import { cn } from "@/lib/utils";
import type { MemberProfile } from "@/types/member";

type SocialProvider = Exclude<MemberProfile["authProvider"], "local">;

const PROVIDER_LABEL: Record<SocialProvider, string> = {
  naver: "네이버",
  kakao: "카카오",
};

interface ProviderBadgeProps {
  provider: SocialProvider;
  /** `circle`: 내 정보 조회(ID-1)의 36px 원형 배지. `pill`: 수정 화면(ID-1-edit)의 라벨 포함 배지. */
  variant: "circle" | "pill";
}

/**
 * "간편로그인" 연동 표시. 브랜드 로고는 로그인 화면 버튼(`NaverLoginButton`·
 * `KakaoLoginButton`, `NaverSignupButton`·`KakaoSignupButton`)에서 이미 Figma 노드를
 * 그대로 옮겨온 것과 같은 asset을 재사용한다 — 임의로 다시 그리지 않는다는 원칙.
 * circle은 로그인 버튼과 동일한 48px viewBox 원형 배지를 36px로 축소해 그린 것이고, pill은
 * signup 버튼의 flat glyph(원형 배경 없는 순수 마크)를 재사용한 별개 asset이다(같은
 * 마크라도 Figma가 배경 유무로 다른 컴포넌트를 쓴다).
 */
function ProviderBadge({ provider, variant }: ProviderBadgeProps) {
  if (variant === "circle") {
    return (
      <div
        role="img"
        aria-label={`${PROVIDER_LABEL[provider]} 계정 연동됨`}
        className="size-9 shrink-0 overflow-hidden rounded-full"
      >
        {provider === "naver" ? (
          <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="24" fill="#03A94D" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M27.2045 24.6355L20.5312 15H15V33H20.7955V23.3679L27.4688 33H33V15H27.2045V24.6355Z"
              fill="white"
            />
          </svg>
        ) : (
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
        )}
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${PROVIDER_LABEL[provider]} 계정 연동계정`}
      className={cn(
        "inline-flex shrink-0 items-center gap-3 rounded-sm px-5 py-2",
        provider === "naver" ? "bg-[#03A94D]" : "bg-[#FEE500]",
      )}
    >
      {provider === "naver" ? (
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
      ) : (
        <svg
          width="16"
          height="14"
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
      )}
      <span
        className={cn(
          "text-body-m font-bold whitespace-nowrap",
          provider === "naver" ? "text-font-white" : "text-black/90",
        )}
      >
        {PROVIDER_LABEL[provider]} 계정 연동계정
      </span>
    </div>
  );
}

export { ProviderBadge };
export type { ProviderBadgeProps };
