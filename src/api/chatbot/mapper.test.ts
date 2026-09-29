import { describe, expect, it } from "vitest";

import {
  mapChatHistory,
  mapChatMessage,
  mapChatSendResultToBotMessage,
} from "./mapper";
import type { ChatMessageDto, ChatSendResultDto } from "./validation";

describe("mapChatMessage", () => {
  it("ADMIN sender를 bot으로 변환한다", () => {
    const dto: ChatMessageDto = {
      messageId: 1,
      sessionId: "session-1",
      sender: "ADMIN",
      content: "안녕하세요",
      sentAt: "2026-09-22T00:00:00",
    };
    expect(mapChatMessage(dto).sender).toBe("bot");
  });

  it("USER sender를 user로 변환하고 suggestions/products는 없다", () => {
    const dto: ChatMessageDto = {
      messageId: 2,
      sessionId: "session-1",
      sender: "USER",
      content: "선물 추천해줘",
      sentAt: "2026-09-22T00:00:00",
    };
    const message = mapChatMessage(dto);
    expect(message.sender).toBe("user");
    expect(message.suggestions).toBeUndefined();
    expect(message.products).toBeUndefined();
  });
});

describe("mapChatHistory", () => {
  it("배열을 그대로 매핑한다", () => {
    const dtos: ChatMessageDto[] = [
      {
        messageId: 1,
        sessionId: "session-1",
        sender: "USER",
        content: "안녕",
        sentAt: "2026-09-22T00:00:00",
      },
    ];
    expect(mapChatHistory(dtos)).toHaveLength(1);
  });
});

describe("mapChatSendResultToBotMessage", () => {
  it("추천 상품을 ProductSummary + reason으로 변환한다", () => {
    const dto: ChatSendResultDto = {
      sessionId: "session-1",
      messageId: 10,
      reply: "이런 상품은 어떠세요?",
      intent: "recommend",
      suggestions: [],
      products: [
        {
          productId: 101,
          name: "백자 달항아리",
          price: 320000,
          thumbnail: [
            {
              url: "https://cdn.example.com/a.webp",
              width: 640,
              height: 640,
              format: "webp",
            },
          ],
          status: "SOLD_OUT",
          category: "kitchen-1",
          rating: 4.8,
          primaryBadge: "NEW",
          artisanId: 11,
          artisanName: "김도예",
          reason: "예산에 맞아요.",
        },
      ],
    };

    const message = mapChatSendResultToBotMessage(dto);

    expect(message.sender).toBe("bot");
    expect(message.id).toBe(10);
    expect(message.products).toEqual([
      {
        product: {
          id: 101,
          name: "백자 달항아리",
          price: 320000,
          thumbnail: null,
          thumbnailUrl: "https://cdn.example.com/a.webp",
          artisan: { id: 11, name: "김도예" },
          craftCategory: "kitchen-1",
          rating: 4.8,
          reviewCount: null,
          primaryBadge: "NEW",
          isSoldOut: true,
        },
        reason: "예산에 맞아요.",
      },
    ]);
  });

  it("products·suggestions가 빈 배열이면 undefined로 정리한다", () => {
    const dto: ChatSendResultDto = {
      sessionId: "session-1",
      messageId: 11,
      reply: "무엇을 도와드릴까요?",
      intent: null,
      suggestions: [],
      products: [],
    };
    const message = mapChatSendResultToBotMessage(dto);
    expect(message.suggestions).toBeUndefined();
    expect(message.products).toBeUndefined();
  });

  it("suggestions가 있으면 그대로 담는다", () => {
    const dto: ChatSendResultDto = {
      sessionId: "session-1",
      messageId: 12,
      reply: "조건에 맞는 상품을 찾지 못했어요.",
      intent: null,
      suggestions: ["질문 추천 1", "질문 추천 2"],
      products: [],
    };
    expect(mapChatSendResultToBotMessage(dto).suggestions).toEqual([
      "질문 추천 1",
      "질문 추천 2",
    ]);
  });
});
