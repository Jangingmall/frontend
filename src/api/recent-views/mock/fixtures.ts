import dayjs from "dayjs";

import type { RecentViewProductDto } from "@/api/recent-views/validation";
import { seedImageRef } from "@/mocks/seed";

function thumbnail(seq: number) {
  return [{ url: seedImageRef(seq).variants[1]!.url }];
}

function viewedAt(hoursAgo: number): string {
  return dayjs().subtract(hoursAgo, "hour").toISOString();
}

/**
 * `GET /api/member/recent-views` mock 시드 — 모듈 스코프 mutable 배열, `viewedAt DESC`
 * 순서로 이미 정렬돼 있다(`api/wishlist/mock/fixtures.ts`와 같은 패턴). 일부러 찜 목록
 * 시드와 productId를 겹치게 둬서(101·103) "최근 본 상품 화면의 일부 카드만 찜됨" 상태를
 * 재현한다(Figma MY-5 확인 — 하트가 카드마다 다름).
 */
export const RECENT_VIEW_FIXTURES: RecentViewProductDto[] = [
  {
    productId: 109,
    name: "놋그릇 5첩 반상기",
    price: 520000,
    thumbnail: thumbnail(9),
    status: "ON_SALE",
    rating: 4.6,
    artisanId: 19,
    artisanName: "강유기",
    primaryBadge: null,
    viewedAt: viewedAt(1),
  },
  {
    productId: 101,
    name: "백자 달항아리",
    price: 320000,
    thumbnail: thumbnail(1),
    status: "ON_SALE",
    rating: 4.8,
    artisanId: 11,
    artisanName: "김도예",
    primaryBadge: "LIMITED",
    viewedAt: viewedAt(3),
  },
  {
    productId: 110,
    name: "천연염색 스카프",
    price: 65000,
    thumbnail: thumbnail(10),
    status: "ON_SALE",
    rating: null,
    artisanId: 20,
    artisanName: "윤염색",
    primaryBadge: "NEW",
    viewedAt: viewedAt(5),
  },
  {
    productId: 103,
    name: "유기 반상기 세트",
    price: 450000,
    thumbnail: thumbnail(3),
    status: "ON_SALE",
    rating: 4.5,
    artisanId: 13,
    artisanName: "박유기",
    primaryBadge: null,
    viewedAt: viewedAt(20),
  },
  {
    productId: 111,
    name: "은장도 노리개",
    price: 210000,
    thumbnail: thumbnail(11),
    status: "SOLD_OUT",
    rating: 4.3,
    artisanId: 21,
    artisanName: "서금속",
    primaryBadge: null,
    viewedAt: viewedAt(48),
  },
  {
    productId: 112,
    name: "옹기 장독",
    price: 380000,
    thumbnail: thumbnail(12),
    status: "ON_SALE",
    rating: 4.0,
    artisanId: 22,
    artisanName: "조옹기",
    primaryBadge: null,
    viewedAt: viewedAt(72),
  },
];
