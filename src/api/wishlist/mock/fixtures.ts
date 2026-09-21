import type { WishlistProductDto } from "@/api/wishlist/validation";
import { seedImageRef } from "@/mocks/seed";

function thumbnail(seq: number) {
  return [{ url: seedImageRef(seq).variants[1]!.url }];
}

/**
 * `GET /api/member/me/wishes` mock 시드 — 모듈 스코프 mutable 배열. `POST|DELETE /wish`
 * 핸들러가 직접 push/splice해 화면에 바로 반영되게 한다(`api/orders/mock/fixtures.ts`와
 * 같은 패턴). `w.id DESC` 정렬을 흉내내 배열 앞쪽이 최신 찜이다.
 */
export const WISH_FIXTURES: WishlistProductDto[] = [
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
  },
  {
    productId: 102,
    name: "옻칠 3단 찬합",
    price: 189000,
    thumbnail: thumbnail(2),
    status: "ON_SALE",
    rating: null,
    artisanId: 12,
    artisanName: "이나전",
    primaryBadge: "NEW",
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
  },
  {
    productId: 104,
    name: "한지 조명갓",
    price: 98000,
    thumbnail: thumbnail(4),
    status: "SOLD_OUT",
    rating: 4.2,
    artisanId: 14,
    artisanName: "정한지",
    primaryBadge: null,
  },
  {
    productId: 105,
    name: "소반 다과상",
    price: 156000,
    thumbnail: thumbnail(5),
    status: "ON_SALE",
    rating: null,
    artisanId: 15,
    artisanName: "최소목",
    primaryBadge: "NEW",
  },
  {
    productId: 106,
    name: "무명 자수 방석",
    price: 72000,
    thumbnail: thumbnail(6),
    status: "ON_SALE",
    rating: 4.9,
    artisanId: 16,
    artisanName: "한자수",
    primaryBadge: null,
  },
  {
    productId: 107,
    name: "청자 다기 세트",
    price: 280000,
    thumbnail: thumbnail(7),
    status: "ON_SALE",
    rating: 4.1,
    artisanId: 17,
    artisanName: "송청자",
    primaryBadge: null,
  },
  {
    productId: 108,
    name: "대나무 채반",
    price: 45000,
    thumbnail: thumbnail(8),
    status: "ON_SALE",
    rating: null,
    artisanId: 18,
    artisanName: "임죽공",
    primaryBadge: null,
  },
];
