import Link from "next/link";

import { ImagePlaceholder } from "./ImagePlaceholder";

/**
 * 홈 히어로. 헤드라인 1줄 + 본문 2줄 + CTA 2개(Figma `987:25006`, 어노테이션 `843:36940`).
 * 타이포·CTA 색은 Figma 실측값 그대로: 헤드라인 48px/600(`display-l`), 본문 16px(`body-l`),
 * CTA 1 = `button` 컴포넌트 `l-jade` variant, CTA 2 = `l-black` variant.
 *
 * 배경은 Figma에선 실제 사진(`Background image`)인데 자산이 없어 `ImagePlaceholder`
 * 체크보드 패턴을 쓴다 — 단색 블록보다 "자산 대기 중"이라는 신호가 분명하다.
 *
 * 텍스트는 Figma 실측대로 흰색이다(본문 fill이 `#ffffff` — 실제 사진이 깔리면 그 위에서
 * 읽히도록 디자인된 색). 체크보드는 밝은색이라 흰 글자를 그대로 얹으면 안 읽혀서, 사진이
 * 실제로 들어왔을 때도 쓸 어두운 스크림(반투명 검정 오버레이)을 배경과 텍스트 사이에 둔다 —
 * 실 사진이 아무리 밝아도 텍스트 대비가 보장된다. (첫 시도는 텍스트를 아예 어두운색으로
 * 바꿨었는데, 그건 배경이 헤더와 같은 어두운 단색이라 경계가 안 보이던 문제의 임시방편이었고
 * Figma 실측 색과도 안 맞았다 — 지금은 스크림으로 정공법 처리.)
 *
 * CTA 2 「장인관 둘러보기」는 원래 `AL-1`(`/artisans`)로 이동하지만, `artisan` 도메인을
 * 만들지 않기로 한 로드맵 결정 때문에 실제 이동은 없앤다(design.md §1-1). GNB가 같은 상황을
 * 처리한 전례(`components/common/gnb-nav.tsx`)를 그대로 따라 `<a>` 대신 `aria-disabled`
 * `<span>`으로 렌더링한다 — `title` 같은 별도 안내는 붙이지 않는다. 시각 스타일은 `l-black`
 * 그대로 유지해 "이동만 없는 버튼"처럼 보이게 한다.
 *
 * `<Button render={<Link/>}>`로 합성하지 않는 이유는 `app/not-found.tsx` 상단 주석 참고
 * (Base UI가 `role="button"`을 강제해 네이티브 링크 시맨틱이 깨짐) — 여기서도 같은 이유로
 * 버튼 시각 스타일만 손으로 옮긴다.
 *
 * 높이는 첫 화면(뷰포트)에서 GNB를 뺀 값(`min-h-hero`, 시안 5종 프레임이 모두 기기 뷰포트
 * 높이 = 히어로 높이)이고, 제목·설명·버튼은 하단에 붙는다. 하단 여백은 시안 실측:
 * 2xl 80 / xl 72 / lg·md 48 / mobile 32.
 */
export function HeroBanner() {
  return (
    <section
      aria-label="히어로"
      className="relative flex min-h-hero flex-col items-center justify-end gap-6 page-gutter pt-24 pb-8 text-font-white md:pb-12 xl:pb-18 2xl:pb-20"
    >
      <ImagePlaceholder className="absolute inset-0 -z-20" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/45" />
      <div className="mx-auto flex w-full max-w-desktop flex-col items-start gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-title-l md:text-display-m 2xl:text-display-l">
            손이 지나간 시간을 그대로 옮겨 담습니다
          </h1>
          <p className="text-body-l font-medium">
            나라가 인정한 손끝에서 나온 물건입니다.
            <br />
            누가 어떻게 만들었는지, 만든 이가 직접 확인한 이야기와 함께 보내
            드립니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-xs bg-(--button-jade) px-4 text-button-xl text-font-dark transition-colors hover:opacity-90 md:h-13.5 md:px-6 md:text-button-l"
          >
            공예품 둘러보기
          </Link>
          <span
            aria-disabled="true"
            className="inline-flex h-11 items-center justify-center rounded-xs bg-(--button-black) px-4 text-button-xl text-font-white md:h-13.5 md:px-6 md:text-button-l"
          >
            장인관 둘러보기
          </span>
        </div>
      </div>
    </section>
  );
}
