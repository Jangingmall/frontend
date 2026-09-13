import Link from "next/link";

/**
 * 홈 히어로. 헤드라인 1줄 + 본문 2줄 + CTA 2개(Figma `987:25006`, 어노테이션 `843:36940`).
 *
 * CTA 2 「장인관 둘러보기」는 원래 `AL-1`(`/artisans`)로 이동하지만, `artisan` 도메인을
 * 만들지 않기로 한 로드맵 결정 때문에 실제 이동은 없앤다(design.md §1-1). GNB가 같은 상황을
 * 처리한 전례(`components/common/gnb-nav.tsx`)를 그대로 따라 `<a>` 대신 `aria-disabled`
 * `<span>`으로 렌더링한다 — `title` 같은 별도 안내는 붙이지 않는다.
 *
 * `<Button render={<Link/>}>`로 합성하지 않는 이유는 `app/not-found.tsx` 상단 주석 참고
 * (Base UI가 `role="button"`을 강제해 네이티브 링크 시맨틱이 깨짐) — 여기서도 같은 이유로
 * 버튼 시각 스타일만 손으로 옮긴다.
 */
export function HeroBanner() {
  return (
    <section
      aria-label="히어로"
      className="flex flex-col items-start gap-6 bg-fill-neutral-impact px-4 py-24 text-font-white sm:px-8 lg:px-12"
    >
      <div className="mx-auto flex w-full max-w-desktop flex-col items-start gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-display-m">
            손이 지나간 시간을 그대로 옮겨 담습니다
          </h1>
          <p className="text-body-l">
            나라가 인정한 손끝에서 나온 물건입니다.
            <br />
            누가 어떻게 만들었는지, 만든 이가 직접 확인한 이야기와 함께 보내
            드립니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/products"
            className="inline-flex h-13.5 items-center justify-center rounded-xs bg-font-white px-6 text-button-l text-font-dark transition-colors hover:opacity-90"
          >
            공예품 둘러보기
          </Link>
          <span
            aria-disabled="true"
            className="inline-flex h-13.5 items-center justify-center rounded-xs border border-font-white px-6 text-button-l text-font-white"
          >
            장인관 둘러보기
          </span>
        </div>
      </div>
    </section>
  );
}
