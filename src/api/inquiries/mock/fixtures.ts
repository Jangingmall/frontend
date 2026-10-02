import type { ProductInquiry } from "@/types/inquiry";

export interface StoredInquiry extends ProductInquiry {
  ownerId: number | string;
}
export function createInquiryFixtures(productId: number): StoredInquiry[] {
  if (productId === 900002)
    return [
      {
        id: 90000200,
        ownerId: 2,
        type: "상품 상세문의",
        title: "식기세척기에 넣어도 괜찮을까요?",
        body: "매일 사용할 예정인데 식기세척기 사용이 가능한지 궁금합니다.",
        author: "김다정",
        createdAt: "2026-09-07",
        isSecret: false,
        canRead: true,
        status: "ANSWERED",
        reply: {
          author: "이청청 공방",
          body: "표면의 질감을 오래 보존하려면 부드러운 수세미로 손세척해주세요. 세척 후 충분히 말려 보관해주세요.",
          createdAt: "2026-09-08",
        },
      },
      {
        id: 90000201,
        ownerId: 2,
        type: "배송",
        title: "다음 달 개업 선물로 받을 수 있을까요?",
        body: "개업 선물로 준비하려고 합니다. 주문 후 제작과 배송은 얼마나 걸리나요?",
        author: "이선물",
        createdAt: "2026-09-06",
        isSecret: false,
        canRead: true,
        status: "ANSWERED",
        reply: {
          author: "이청청 공방",
          body: "주문 후 약 4주간 제작하며 완성 후 순차 발송합니다. 여유 있게 주문해주시고 필요한 일정은 주문 시 남겨주세요.",
          createdAt: "2026-09-07",
        },
      },
      {
        id: 90000202,
        ownerId: 2,
        type: "상품 상세문의",
        title: "2인 세트 구성과 포장이 궁금해요",
        body: "2인 세트에 찻받침도 포함되어 있나요? 나무 상자 포장을 선택할 수 있나요?",
        author: "박민서",
        createdAt: "2026-09-05",
        isSecret: false,
        canRead: true,
        status: "ANSWERED",
        reply: {
          author: "이청청 공방",
          body: "2인 세트는 찻잔 2개와 꽃잎 찻받침 2개로 구성됩니다. 선물 옵션에서 나무 선물 상자 포장을 선택하실 수 있습니다.",
          createdAt: "2026-09-06",
        },
      },
    ];
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
