import type { ChatMessage, ChatRecommendedProduct } from "@/types/chatbot";
import type { ProductSummary } from "@/types/product";

import type {
  ChatMessageDto,
  ChatProductCardDto,
  ChatSendResultDto,
} from "./validation";

function mapProductCard(dto: ChatProductCardDto): ChatRecommendedProduct {
  const product: ProductSummary = {
    id: dto.productId,
    name: dto.name,
    price: dto.price,
    thumbnail: null,
    // 실제 BE는 단일 썸네일 URL만 준다 — `mapWishlistPage`와 동일 패턴.
    thumbnailUrl: dto.thumbnail[0]?.url ?? null,
    artisan: { id: dto.artisanId, name: dto.artisanName },
    craftCategory: dto.category,
    rating: dto.rating,
    reviewCount: null,
    primaryBadge: dto.primaryBadge,
    isSoldOut: dto.status === "SOLD_OUT",
  };
  return { product, reason: dto.reason };
}

/** 히스토리 GET(`docs/api-contract.md` §7) — 유효성 검증에만 쓰고 화면 표시엔 안 쓴다. */
export function mapChatMessage(dto: ChatMessageDto): ChatMessage {
  return {
    id: dto.messageId,
    sessionId: dto.sessionId,
    sender: dto.sender === "ADMIN" ? "bot" : "user",
    content: dto.content,
    sentAt: dto.sentAt,
  };
}

export function mapChatHistory(dtos: ChatMessageDto[]): ChatMessage[] {
  return dtos.map(mapChatMessage);
}

/**
 * 메시지 전송 응답의 봇 답변 절반만 변환한다. 사용자가 방금 보낸 메시지 쪽은 BE가 별도
 * id를 돌려주지 않으므로(`SendResult`엔 봇 `messageId`만 있음) 호출부(뮤테이션)가 입력값을
 * 그대로 받아 로컬 id를 붙여 낙관적으로 먼저 붙이고, 이 함수의 결과를 그 뒤에 이어붙인다.
 * `sentAt`도 BE가 안 줘서 호출 시점으로 채운다.
 */
export function mapChatSendResultToBotMessage(
  dto: ChatSendResultDto,
): ChatMessage {
  return {
    id: dto.messageId,
    sessionId: dto.sessionId,
    sender: "bot",
    content: dto.reply,
    sentAt: new Date().toISOString(),
    suggestions: dto.suggestions.length > 0 ? dto.suggestions : undefined,
    products:
      dto.products.length > 0 ? dto.products.map(mapProductCard) : undefined,
  };
}
