import type { ProductInquiry } from "@/types/inquiry";

export interface StoredInquiry extends ProductInquiry {
  ownerId: number;
}
export function createInquiryFixtures(productId: number): StoredInquiry[] {
  if (productId === 102) return [];
  return Array.from({ length: 8 }, (_, index) => ({
    id: index + 1,
    ownerId: index === 2 ? 1 : 2,
    type: index % 2 === 0 ? "상품 상세문의" : "배송",
    title: [
      "식기세척기 사용이 가능한가요?",
      "선물 포장과 배송 일정을 알고 싶어요",
      "비공개 배송지",
    ][Math.min(index, 2)],
    body:
      index >= 2
        ? "비공개 배송지 문의입니다."
        : "작품 관리 방법과 주문 후 발송 일정을 안내해주세요.",
    author: index === 2 ? "김미담" : "박*연",
    createdAt: `2026-09-${String(13 - index).padStart(2, "0")}`,
    isSecret: index >= 2,
    canRead: true,
    status: index === 0 ? "WAITING" : "ANSWERED",
    reply:
      index === 0
        ? null
        : {
            author: "미담 공방",
            body:
              index >= 2
                ? "비공개 답변입니다."
                : "주문 후 3~5일 이내에 발송합니다. 손으로 부드럽게 세척해 오래 간직해주세요.",
            createdAt: "2026-09-13",
          },
  }));
}
