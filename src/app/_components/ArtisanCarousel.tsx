"use client";

import { useState } from "react";

import { ARTISAN_CAROUSEL_ITEMS } from "@/app/_lib/artisan-carousel-fixtures";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";

import { SectionHeader } from "./SectionHeader";

/**
 * 홈 "장인관" 배너 캐러셀(design.md §1-1) — 시각적으로는 원본(Figma `814:35609`,
 * `987:25006`) 그대로 두되 실제 이동은 없앤다: `artisan` 도메인 api/타입을 만들지 않기로
 * 한 로드맵 결정 때문에 `AL-1`/`AD-1` 라우트 자체가 없다.
 *
 * 레이아웃은 Figma 실측대로 큰 이미지(좌, ~65%)+정보 패널(우, 422px 고정, 38px 간격)을
 * 옅은 배경(`bg-subtle`) 위에 나란히 두고, 좌우 화살표는 그 박스의 양쪽 가장자리에 세로
 * 중앙 정렬로 얹는다(초기 구현은 이미지·정보를 동일 폭 2단 그리드로, 화살표는 박스 바깥
 * 좌우에 별개 버튼으로 둬서 비율·오버레이 여부가 둘 다 달랐다).
 *
 * Figma의 화살표 아이콘은 흰색인데, 이는 실제 사진 위에 얹혀서다 — 지금은 사진 자산이
 * 없어 밝은 플레이스홀더 블록(`bg-skeleton`)이라 아이콘 기본색(어두운 색)을 그대로 둔다.
 * 실 이미지가 들어오면 다시 확인.
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
      className="mx-auto w-full max-w-desktop px-4 py-13 sm:px-8 lg:px-12"
    >
      <SectionHeader
        title="장인관"
        description="한 사람의 작업을 처음부터 끝까지 들여다봅니다"
        viewAll={{ disabled: true }}
      />
      <div className="bg-subtle relative mt-6 flex flex-col gap-9.5 p-6 lg:flex-row">
        <div
          aria-hidden="true"
          className="bg-skeleton aspect-4/3 flex-1 lg:aspect-auto"
        />
        <div className="flex flex-col justify-between gap-7 lg:w-105.5 lg:shrink-0">
          <div className="flex flex-col gap-7">
            <div className="flex gap-2">
              <Badge variant="jade">국가무형유산</Badge>
              <Badge variant="jade">{item.badge}</Badge>
            </div>
            <div>
              <h3 className="text-title-m">{item.headline}</h3>
              <p className="mt-1 text-body-m text-font-dark-secondary">
                {item.description}
              </p>
            </div>
            <dl className="flex gap-6 text-body-m">
              <div>
                <dt className="text-caption text-font-dark-secondary">경력</dt>
                <dd>{item.experience}</dd>
              </div>
              <div>
                <dt className="text-caption text-font-dark-secondary">
                  작품 수
                </dt>
                <dd>{item.artworkCount}</dd>
              </div>
              <div>
                <dt className="text-caption text-font-dark-secondary">공방</dt>
                <dd>{item.workshop}</dd>
              </div>
            </dl>
          </div>
          <span
            aria-disabled="true"
            className="inline-flex h-14 w-fit items-center justify-center rounded-xs bg-(--button-black) px-6 text-button-l text-font-white"
          >
            장인관 둘러보기
          </span>
        </div>
        <button
          type="button"
          aria-label="이전 장인"
          onClick={() => setIndex((current) => (current - 1 + total) % total)}
          className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full p-2 hover:bg-states-hover"
        >
          <ArrowLeftIcon />
        </button>
        <button
          type="button"
          aria-label="다음 장인"
          onClick={() => setIndex((current) => (current + 1) % total)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-2 hover:bg-states-hover"
        >
          <ArrowRightIcon />
        </button>
      </div>
      <p
        role="status"
        className="mt-3 text-center text-body-s text-font-dark-secondary"
      >
        {index + 1} / {total}
      </p>
    </section>
  );
}
