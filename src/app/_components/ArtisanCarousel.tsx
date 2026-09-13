"use client";

import { useState } from "react";

import { ARTISAN_CAROUSEL_ITEMS } from "@/app/_lib/artisan-carousel-fixtures";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";

/**
 * 홈 "장인관" 배너 캐러셀(design.md §1-1) — 시각적으로는 원본(Figma `814:35609`) 그대로
 * 두되 실제 이동은 없앤다: `artisan` 도메인 api/타입을 만들지 않기로 한 로드맵 결정 때문에
 * `AL-1`/`AD-1` 라우트 자체가 없다.
 *
 * 좌우 화살표로 6장 사이를 넘기는 건 로컬 UI 상태라 그대로 동작한다. 「전체보기」·카드 내
 * 「장인관 둘러보기」·카드 자체 클릭은 GNB의 비활성 항목 처리(`components/common/gnb-nav.tsx`)
 * 를 그대로 따라 `<a>`/`<button>` 대신 `aria-disabled` 요소로 렌더링한다 — 별도 안내 문구
 * 없음.
 */
export function ArtisanCarousel() {
  const [index, setIndex] = useState(0);
  const total = ARTISAN_CAROUSEL_ITEMS.length;
  const item = ARTISAN_CAROUSEL_ITEMS[index];

  return (
    <section
      aria-label="장인관"
      className="mx-auto w-full max-w-desktop px-4 py-12 sm:px-8 lg:px-12"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-title-l">장인관</h2>
          <p className="mt-1 text-body-m text-font-dark-subtle">
            한 사람의 작업을 처음부터 끝까지 들여다봅니다
          </p>
        </div>
        <span
          aria-disabled="true"
          className="shrink-0 text-body-s text-font-dark-subtle"
        >
          전체보기
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="이전 장인"
          onClick={() => setIndex((current) => (current - 1 + total) % total)}
          className="shrink-0 rounded-xs p-2 hover:bg-states-hover"
        >
          <ArrowLeftIcon />
        </button>
        <article className="grid flex-1 grid-cols-1 gap-6 bg-fill-jade-weak p-6 sm:grid-cols-2">
          <div
            aria-hidden="true"
            className="aspect-4/3 w-full bg-border-neutral-subtle"
          />
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Badge variant="jade">국가무형유산</Badge>
              <Badge variant="jade">{item.badge}</Badge>
            </div>
            <div>
              <h3 className="text-title-m">{item.headline}</h3>
              <p className="mt-1 text-body-m text-font-dark-subtle">
                {item.description}
              </p>
            </div>
            <dl className="flex gap-6 text-body-m">
              <div>
                <dt className="text-caption text-font-dark-subtle">경력</dt>
                <dd>{item.experience}</dd>
              </div>
              <div>
                <dt className="text-caption text-font-dark-subtle">작품 수</dt>
                <dd>{item.artworkCount}</dd>
              </div>
              <div>
                <dt className="text-caption text-font-dark-subtle">공방</dt>
                <dd>{item.workshop}</dd>
              </div>
            </dl>
            <span
              aria-disabled="true"
              className="inline-flex h-11 w-fit items-center justify-center rounded-xs border border-(--button-border-black) px-6 text-body-m text-font-dark"
            >
              장인관 둘러보기
            </span>
          </div>
        </article>
        <button
          type="button"
          aria-label="다음 장인"
          onClick={() => setIndex((current) => (current + 1) % total)}
          className="shrink-0 rounded-xs p-2 hover:bg-states-hover"
        >
          <ArrowRightIcon />
        </button>
      </div>
      <p
        role="status"
        className="mt-3 text-center text-body-s text-font-dark-subtle"
      >
        {index + 1} / {total}
      </p>
    </section>
  );
}
