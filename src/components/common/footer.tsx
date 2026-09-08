import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / Footer` (1440×364, `--fill-neutral-impact` 배경). 사이트 하단.
 * 콘텐츠(링크 라벨·회사 정보)는 Figma 에 placeholder(○○○) 로만 있어 기본값으로 박아두고
 * `columns` / `description` / `logo` 로 덮어쓸 수 있게 한다. 하단 고지·카피라이트는 고정 문구.
 * 반응형은 미정 — desktop(1440) 기준.
 */
interface FooterColumnItem {
  label: string;
  href?: string;
  /** 전화번호처럼 강조되는 항목 */
  strong?: boolean;
}

interface FooterColumn {
  title: string;
  items: FooterColumnItem[];
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "미담",
    items: [
      { label: "브랜드 소개", href: "#" },
      { label: "입점 안내", href: "#" },
      { label: "공지사항", href: "#" },
    ],
  },
  {
    title: "고객",
    items: [
      { label: "자주 묻는 질문", href: "#" },
      { label: "배송 · 교환 환불", href: "#" },
      { label: "분쟁 처리 기준", href: "#" },
    ],
  },
  {
    title: "정책",
    items: [
      { label: "이용약관", href: "#" },
      { label: "개인정보처리방침", href: "#" },
    ],
  },
  {
    title: "고객센터",
    items: [
      { label: "000-0000-0000", strong: true },
      { label: "운영시간 : 10:00~17:00" },
      { label: "점심시간 : 12:00~13:00" },
      { label: "주말 공휴일 제외" },
    ],
  },
];

const LOGO_PLACEHOLDER = (
  <span className="inline-flex h-8 w-fit items-center bg-(--jade-blue-400) px-3 text-title-l text-font-dark-subtle">
    로고
  </span>
);

const DEFAULT_DESCRIPTION = (
  <div className="flex flex-col gap-7 text-body-s text-font-dark-weak">
    <p>국가무형유산 전승자의 작품을 그 내력과 함께 전합니다.</p>
    <p>
      (주)미담 | 대표 ○○○ | 개인정보보호책임자 ○○○ 사업자등록번호 000-00-00000 |
      통신판매업 신고 제2026-○○○○-0000호 대표번호 00-0000-0000 | 주소 ○○시 ○○구
      ○○로 00, 0층
    </p>
  </div>
);

interface FooterProps extends ComponentProps<"footer"> {
  logo?: ReactNode;
  /** 로고 아래 회사 소개·사업자 정보 블록 */
  description?: ReactNode;
  columns?: FooterColumn[];
}

function Footer({
  logo = LOGO_PLACEHOLDER,
  description = DEFAULT_DESCRIPTION,
  columns = DEFAULT_COLUMNS,
  className,
  ...props
}: FooterProps) {
  return (
    <footer
      data-slot="footer"
      className={cn(
        "flex flex-col gap-12 bg-fill-neutral-impact px-12 pt-12 pb-16",
        className,
      )}
      {...props}
    >
      <div className="flex justify-between gap-12">
        <div className="flex max-w-md flex-col items-start gap-3">
          {logo}
          {description}
        </div>
        <div className="flex shrink-0 gap-12">
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-4">
              <span className="text-body-s-b whitespace-nowrap text-font-white">
                {column.title}
              </span>
              <ul className="flex flex-col gap-1">
                {column.items.map((item) => {
                  const itemClass = cn(
                    "text-body-s whitespace-nowrap text-font-dark-weak",
                    item.strong && "text-body-s-b text-font-white",
                  );
                  return (
                    <li key={item.label}>
                      {item.href ? (
                        <a href={item.href} className={itemClass}>
                          {item.label}
                        </a>
                      ) : (
                        <span className={itemClass}>{item.label}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 border-t border-border-white/10 pt-6">
        <div className="flex items-start justify-between gap-8 text-body-s text-font-dark-weak">
          <p className="max-w-3xl">
            미담 상품 중 (주)미담이 판매자로 등록된 상품을 제외한 모든 상품은
            개별 입점 판매자가 판매하는 상품입니다. (주)미담은
            통신판매중개자로서 해당 상품들의 거래 당사자가 아니며, 판매작가가
            등록한 정보 및 거래에 대해 일체의 책임을 지지 않습니다.
          </p>
          <p className="shrink-0">
            Copyright © 2026 MIDAM | All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
export type { FooterProps, FooterColumn, FooterColumnItem };
