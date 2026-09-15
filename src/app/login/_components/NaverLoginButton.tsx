/**
 * 네이버 소셜 로그인 원형 버튼. IA LI-1엔 있지만 이번 PR에선 **비활성**이다.
 *
 * 카카오와 달리 BE 어디에도 네이버 OAuth2 엔드포인트가 없다(`docs/회원_구현_현황.md`,
 * `PHASE2-2_인증_정책_계약서.md` 모두 카카오·구글만 명시) — IA의 "네이버·카카오만(구글 제외)"
 * 확정 메모가 실제 엔지니어링 현실과 어긋난다. PM에게 별도 전달 대상이고, BE가 네이버를
 * 추가하기 전까지는 연결할 곳 자체가 없어 비활성으로만 둔다.
 */
export function NaverLoginButton() {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label="네이버로 로그인 (준비 중)"
      className="flex size-12 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-[#03C75A] text-caption text-font-white opacity-60"
    >
      네이버
    </button>
  );
}
