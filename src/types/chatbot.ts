import type { ProductSummary } from "@/types/product";

/** `api/chatbot` 응답의 `products[]` 한 항목. (docs/api-contract.md §7) */
export interface ChatRecommendedProduct {
  product: ProductSummary;
  /** AI가 이 상품을 추천한 이유. `ProductSummary`엔 없는 챗봇 전용 필드라 별도로 감싼다. */
  reason: string;
}

/** 챗봇 대화 메시지 한 건. (docs/api-contract.md §7) */
export interface ChatMessage {
  id: number;
  sessionId: string;
  sender: "user" | "bot";
  content: string;
  sentAt: string;
  /** `sendMessage` 응답에서 온 봇 메시지에만 있다. */
  suggestions?: string[];
  /**
   * `sendMessage` 응답에서 온 봇 메시지에만 있다. 히스토리 재조회(`GET
   * /sessions/{id}/messages`)로는 복원되지 않는다 — BE 응답 타입 자체에 없다.
   */
  products?: ChatRecommendedProduct[];
}
