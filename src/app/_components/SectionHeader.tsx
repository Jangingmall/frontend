import Link from "next/link";
import type { ComponentProps } from "react";

type SectionViewAll =
  | { disabled?: false; href: ComponentProps<typeof Link>["href"] }
  | { disabled: true };

interface SectionHeaderProps {
  title: string;
  description: string;
  viewAll: SectionViewAll;
}

/**
 * 홈 섹션(베스트·선물·장인관·신상품·기획전) 공용 헤더 — Figma 실측(`987:25006`)대로
 * 제목은 단독 줄(`display-m`, 32px/600), 설명과 「전체보기」는 같은 줄에서 좌우로 나뉜다.
 * 초기 구현은 제목·전체보기를 한 줄에, 설명을 그 아래 줄에 둬서 순서가 뒤집혀 있었다 —
 * 4개 섹션이 전부 같은 실수를 공유해서 한 곳(`SectionHeader`)으로 모아 고친다.
 *
 * `viewAll.disabled`면 GNB의 비활성 항목 처리(`components/common/gnb-nav.tsx`)를 그대로
 * 따라 `<a>` 대신 `aria-disabled` `<span>`으로 렌더링한다 — 장인관처럼 목적지 라우트가
 * 없는 경우.
 */
export function SectionHeader({
  title,
  description,
  viewAll,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col">
      <h2 className="text-display-m text-font-dark">{title}</h2>
      <div className="flex items-center justify-between gap-4">
        <p className="text-body-m text-font-dark-secondary">{description}</p>
        {viewAll.disabled ? (
          <span
            aria-disabled="true"
            className="shrink-0 text-body-s text-font-dark-secondary"
          >
            전체보기
          </span>
        ) : (
          <Link
            href={viewAll.href}
            className="shrink-0 text-body-s text-font-dark"
          >
            전체보기
          </Link>
        )}
      </div>
    </div>
  );
}
