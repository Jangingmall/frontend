import type { MyReview, ProductReview } from "@/types/review";

const CONTENTS = [
  "은은한 빛깔이 사진보다 더 아름다워요. 매일 쓰는 찻잔이 되었습니다.",
  "손에 쥐었을 때 편안하고 마감도 꼼꼼합니다.",
  "선물 포장이 정성스러워 받는 분도 무척 좋아하셨어요.",
  "일상 속에서 장인의 손길을 느낄 수 있어 만족합니다.",
];
/**
 * "내가 작성한 후기"(`GET /api/member/me/reviews`, 목업 전용) 시드 데이터. 페이지네이션
 * (size 5) 확인을 위해 5건보다 많이 둔다. `POST /api/products/{id}/reviews` 성공 시 이
 * 배열에 새 항목을 `unshift`한다 — mutable 배열로 둔다.
 */
export const MY_REVIEW_FIXTURES: MyReview[] = [
  {
    id: 1,
    orderItemId: 8001,
    productId: 1001,
    productName: "백자 달항아리",
    thumbnailUrl: "https://cdn.midam.store/products/1001.jpg",
    rating: 4.5,
    content:
      "은은한 빛깔이 사진보다 더 아름다워요. 매일 쓰는 찻잔이 되었습니다.",
    images: [{ src: "/images/product-placeholder.png", alt: "후기 사진 예시" }],
    createdAt: "2026-06-14T00:00:00.000Z",
  },
  {
    id: 2,
    orderItemId: 8002,
    productId: 1002,
    productName: "옻칠 3단 찬합",
    thumbnailUrl: "https://cdn.midam.store/products/1002.jpg",
    rating: 3.5,
    content: "손에 쥐었을 때 편안하고 마감도 꼼꼼합니다.",
    images: [],
    createdAt: "2026-06-10T00:00:00.000Z",
  },
  {
    id: 3,
    orderItemId: 8003,
    productId: 1003,
    productName: "유기 반상기 세트",
    thumbnailUrl: "https://cdn.midam.store/products/1003.jpg",
    rating: 5,
    content: "선물 포장이 정성스러워 받는 분도 무척 좋아하셨어요.",
    images: [],
    createdAt: "2026-05-28T00:00:00.000Z",
  },
  {
    id: 4,
    orderItemId: 8004,
    productId: 1004,
    productName: "한지 조명갓",
    thumbnailUrl: "https://cdn.midam.store/products/1004.jpg",
    rating: 4,
    content: "일상 속에서 장인의 손길을 느낄 수 있어 만족합니다.",
    images: [],
    createdAt: "2026-05-20T00:00:00.000Z",
  },
  {
    id: 5,
    orderItemId: 8005,
    productId: 1005,
    productName: "소반 다과상",
    thumbnailUrl: "https://cdn.midam.store/products/1005.jpg",
    rating: 2.5,
    content: "생각보다 크기가 작았지만 마감은 좋습니다.",
    images: [],
    createdAt: "2026-05-02T00:00:00.000Z",
  },
  {
    id: 6,
    orderItemId: 8006,
    productId: 1006,
    productName: "무명 자수 방석",
    thumbnailUrl: "https://cdn.midam.store/products/1006.jpg",
    rating: 5,
    content: "선물용으로 샀는데 포장부터 완성도까지 전부 만족스러웠습니다.",
    images: [],
    createdAt: "2026-04-18T00:00:00.000Z",
  },
];

export function createReviewFixtures(productId: number): ProductReview[] {
  const count = productId === 102 ? 0 : productId === 101 ? 12 : 5;
  return Array.from({ length: count }, (_, index) => ({
    id: productId * 100 + index,
    author: ["김미담", "박*연", "이*우", "최*원"][index % 4],
    rating: [5, 4, 5, 3, 4, 5][index % 6],
    createdAt: `2026-09-${String(13 - index).padStart(2, "0")}`,
    body: CONTENTS[index % CONTENTS.length],
    optionLabel: "청자 / 기본 구성",
    images:
      index % 2 === 0
        ? [{ src: "/images/product-placeholder.png", alt: "후기 사진 예시" }]
        : [],
  }));
}
