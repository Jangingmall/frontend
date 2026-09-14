import type { ProductReview } from "@/types/review";

const CONTENTS = [
  "은은한 빛깔이 사진보다 더 아름다워요. 매일 쓰는 찻잔이 되었습니다.",
  "손에 쥐었을 때 편안하고 마감도 꼼꼼합니다.",
  "선물 포장이 정성스러워 받는 분도 무척 좋아하셨어요.",
  "일상 속에서 장인의 손길을 느낄 수 있어 만족합니다.",
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
