"use client";

import { useState } from "react";

import { ARTISAN_CAROUSEL_ITEMS } from "@/app/_lib/artisan-carousel-fixtures";
import { Badge } from "@/components/ui/badge";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

import { ImagePlaceholder } from "./ImagePlaceholder";
import { SectionHeader } from "./SectionHeader";

/**
 * 홈 "장인관" 배너 캐러셀(design.md §1-1) — 시각적으로는 원본(Figma `814:35609`,
 * `987:25006`) 그대로 두되 실제 이동은 없앤다: `artisan` 도메인 api/타입을 만들지 않기로
 * 한 로드맵 결정 때문에 `AL-1`/`AD-1` 라우트 자체가 없다.
 *
 * 2차 피드백(직접 Figma 재대조) 반영:
 * - 박스 자체엔 Figma상 패딩이 없다(`Exhibition main container` 1344×520, 컨테이너 레벨
 *   패딩 0) — 첫 구현의 `p-6`은 이 컨테이너에 없는 여백을 만들어 "좌우 margin이 다르다"는
 *   지적을 낳았다. 이미지에만 8px 매트가 있다(`Exhibition image` 자체 padding 8).
 * - 페이지네이션(`N / 6`)은 박스 밖 별도 줄이 아니라 박스 **안**에 있어야 한다(어노테이션
 *   `814:35609` 원문에도 박스 안 우하단 쪽 좌표) — 박스 우하단에 오버레이.
 * - 화살표 아이콘은 Arrow가 아니라 Chevron 계열.
 * - 헤드라인 32px/600(`display-m`, 섹션 제목과 동일 크기), 설명 16px/500
 *   (`body-l`+`font-medium`, 색 `font-dark-subtle`) — 첫 구현은 각각 `title-m`(17px)·
 *   `body-m`(14px, 색도 다름)로 훨씬 작게 썼다.
 * - 경력·작품 수·공방 라벨/값 전부 14px·17px + `font-dark-weak`(Figma 실측 라벨·값 색이
 *   동일 — 특이하지만 그대로 반영). 세 항목 사이에 세로 구분선 추가.
 * - 이미지 비율은 4:3이 아니라 Figma 실측(774:520) 그대로.
 * - 이미지는 다른 "자산 없음" 자리와 같은 체크보드 플레이스홀더(`ImagePlaceholder`).
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
      <div className="relative mt-6 flex flex-col items-center gap-9.5 bg-bg-subtle lg:flex-row">
        <div className="aspect-[774/520] w-full shrink-0 p-2 lg:w-[774px]">
          <ImagePlaceholder className="h-full w-full" />
        </div>
        <div className="flex flex-col gap-7 px-6 pb-16 lg:w-105.5 lg:shrink-0 lg:px-0 lg:pr-9.5 lg:pb-0">
          <div className="flex gap-2">
            <Badge variant="jade">국가무형유산</Badge>
            <Badge variant="jade">{item.badge}</Badge>
          </div>
          <div>
            <h3 className="text-display-m text-font-dark">{item.headline}</h3>
            <p className="mt-1 text-body-l font-medium text-font-dark-subtle">
              {item.description}
            </p>
          </div>
          <dl className="flex text-font-dark-weak">
            <div className="flex flex-col gap-1 pr-6">
              <dt className="text-body-m">경력</dt>
              <dd className="text-title-m">{item.experience}</dd>
            </div>
            <div className="flex flex-col gap-1 border-l border-border-neutral-subtle px-6">
              <dt className="text-body-m">작품 수</dt>
              <dd className="text-title-m">{item.artworkCount}</dd>
            </div>
            <div className="flex flex-col gap-1 border-l border-border-neutral-subtle pl-6">
              <dt className="text-body-m">공방</dt>
              <dd className="text-title-m">{item.workshop}</dd>
            </div>
          </dl>
          <span
            aria-disabled="true"
            className="inline-flex h-14 w-fit items-center justify-center rounded-xs bg-(--button-black) px-6 text-button-xl text-font-white"
          >
            장인관 둘러보기
          </span>
        </div>
        <button
          type="button"
          aria-label="이전 장인"
          onClick={() => setIndex((current) => (current - 1 + total) % total)}
          className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-bg-default p-2 hover:bg-states-hover"
        >
          <ChevronLeftIcon className="size-10" />
        </button>
        <button
          type="button"
          aria-label="다음 장인"
          onClick={() => setIndex((current) => (current + 1) % total)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-bg-default p-2 hover:bg-states-hover"
        >
          <ChevronRightIcon className="size-10" />
        </button>
        <p
          role="status"
          className="absolute right-4 bottom-4 rounded-full bg-fill-neutral-impact/10 px-2 py-1 text-caption text-font-dark-subtle"
        >
          {index + 1} / {total}
        </p>
      </div>
    </section>
  );
}
