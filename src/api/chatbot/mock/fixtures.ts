import type {
  ChatMessageDto,
  ChatProductCardDto,
} from "@/api/chatbot/validation";

interface ChatSessionRecord {
  ended: boolean;
  messages: ChatMessageDto[];
}

/**
 * 세션별 대화 상태 — 모듈 스코프 mutable Map(`api/orders/mock/fixtures.ts`와 같은 패턴).
 * 서버 핸들러(`handlers.ts`)가 직접 읽고 쓴다.
 */
export const CHAT_SESSIONS = new Map<string, ChatSessionRecord>();

let nextMessageId = 1;

export function nextChatMessageId(): number {
  return nextMessageId++;
}

export const CHAT_RECOMMEND_REASON = "";

/** Figma 시연의 고정 상품. 실제 상품 ID나 상세 경로와 연결하지 않는다. */
export function buildRecommendProducts(): ChatProductCardDto[] {
  return [
    {
      id: 900001,
      name: "도기토 수반",
      artisan: "박수반",
      price: 110500,
      image: "dogito-bowl.png",
    },
    {
      id: 900002,
      name: "청자 분청 찻잔",
      artisan: "이청청",
      price: 120000,
      image: "celadon-teacup.png",
    },
    {
      id: 900003,
      name: "오배자염 테이블러너",
      artisan: "오자염",
      price: 140000,
      image: "table-runner.png",
    },
  ].map((product) => ({
    productId: product.id,
    name: product.name,
    price: product.price,
    thumbnail: [
      {
        url: `/images/chatbot-demo/${product.image}`,
        width: 640,
        height: 640,
        format: "png",
      },
    ],
    status: "ON_SALE",
    category: null,
    rating: null,
    primaryBadge: "NEW",
    artisanId: product.id,
    artisanName: product.artisan,
    reason: CHAT_RECOMMEND_REASON,
  }));
}
