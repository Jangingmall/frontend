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
  if (productId === 900002)
    return [
      {
        id: 90000200,
        author: "김차향",
        createdAt: "2026-09-01",
        body: "정말 기대 이상이에요. 실물로 보면 색감이 훨씬 더 아름답고 손에 쥐었을 때 무게감이 딱 적당합니다. 차를 마실 때마다 기분이 달라지는 느낌이에요.",
        optionLabel:
          "찻잔 + 꽃잎 찻받침 세트 / 청자색 / 중 - 150ml / 고급 한지 박스 포장",
        rating: 5,
        images: [],
      },
      {
        id: 90000201,
        author: "이민준",
        createdAt: "2026-08-28",
        body: "선물용으로 구매했는데 받으신 분이 너무 좋아하셨어요. 나무 선물 상자 포장이 고급스러워서 따로 포장을 안 해도 될 정도였습니다.",
        optionLabel:
          "찻잔 + 꽃잎 찻받침 세트 / 청자색 / 중 - 150ml / 나무 선물 상자 포장",
        rating: 5,
        images: [],
      },
      {
        id: 90000202,
        author: "박초록",
        createdAt: "2026-08-20",
        body: "흙의 질감이 그대로 느껴지는 찻잔이에요. 녹차를 마시면 향이 더 잘 느껴지는 것 같아요. 배송도 꼼꼼하게 포장돼서 왔어요.",
        optionLabel:
          "찻잔 + 꽃잎 찻받침 세트 / 청자색 / 중 - 150ml / 포장 없음",
        rating: 5,
        images: [],
      },
      {
        id: 90000203,
        author: "박하늘",
        createdAt: "2026-08-15",
        body: "장인이 직접 만드신 거라 그런지 완성도가 남달라요. 찻받침 꽃 모양이 너무 예뻐서 인테리어 소품으로도 손색없을 것 같아요.",
        optionLabel:
          "찻잔 + 꽃잎 찻받침 세트 / 유백색 / 소 - 80ml / 전통 보자기 포장",
        rating: 5,
        images: [],
      },
      {
        id: 90000204,
        author: "이온결",
        createdAt: "2026-08-10",
        body: "색감과 질감은 정말 마음에 드는데 제작 기간이 4주로 조금 길게 느껴졌어요. 그래도 받고 나니 기다린 보람이 있었습니다.",
        optionLabel:
          "2인 세트 - 찻잔2개 + 꽃잎 찻받침2개 / 회청색 / 중 - 150ml / 포장 없음",
        rating: 5,
        images: [],
      },
    ];
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
