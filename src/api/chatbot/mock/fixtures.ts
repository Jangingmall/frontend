import type {
  ChatMessageDto,
  ChatProductCardDto,
} from "@/api/chatbot/validation";
import { productCatalogue } from "@/api/products/mock/catalogue";

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

export const CHAT_RECOMMEND_REASON = "예산과 취향에 맞춰 골라봤어요.";

/** 첫 메시지에 "선물"·"추천" 포함 시 보여줄 추천 상품 3개 — `productCatalogue` 앞 3개 재사용. */
export function buildRecommendProducts(): ChatProductCardDto[] {
  return productCatalogue.slice(0, 3).map((product) => ({
    productId: product.id,
    name: product.name,
    price: product.price,
    thumbnail: [
      {
        url: product.thumbnail.variants[1]?.url ?? "",
        width: 640,
        height: 640,
        format: "webp",
      },
    ],
    status: product.status,
    category: product.category,
    rating: product.rating,
    primaryBadge: product.primaryBadge,
    artisanId: product.artisan.id,
    artisanName: product.artisan.name,
    reason: CHAT_RECOMMEND_REASON,
  }));
}
