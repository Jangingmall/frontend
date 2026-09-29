import { describe, expect, it } from "vitest";

import {
  chatHistoryDto,
  chatMessageDto,
  chatSendResultDto,
  chatSessionDto,
} from "./validation";

describe("chatSessionDto", () => {
  it("세션 생성 응답을 검증한다", () => {
    const parsed = chatSessionDto.parse({
      sessionId: "session-1",
      expiresInSeconds: 3600,
    });
    expect(parsed).toMatchObject({ sessionId: "session-1" });
  });
});

describe("chatSendResultDto", () => {
  it("추천 상품 포함 응답을 검증한다", () => {
    const parsed = chatSendResultDto.parse({
      sessionId: "session-1",
      messageId: 2,
      reply: "이런 상품은 어떠세요?",
      intent: "recommend",
      suggestions: ["신상품 보여줘"],
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
          status: "ON_SALE",
          category: "kitchen-1",
          rating: 4.8,
          primaryBadge: "NEW",
          artisanId: 11,
          artisanName: "김도예",
          reason: "예산에 맞아요.",
        },
      ],
    });
    expect(parsed.products).toHaveLength(1);
    expect(parsed.products[0]).toMatchObject({ productId: 101 });
  });

  it("products·suggestions 빈 배열, intent null도 허용한다", () => {
    const parsed = chatSendResultDto.parse({
      sessionId: "session-1",
      messageId: 3,
      reply: "현재 AI 추천을 이용할 수 없습니다",
      intent: null,
      suggestions: [],
      products: [],
    });
    expect(parsed.intent).toBeNull();
    expect(parsed.products).toEqual([]);
  });
});

describe("chatMessageDto / chatHistoryDto", () => {
  it("sender는 USER/ADMIN만 허용한다", () => {
    expect(() =>
      chatMessageDto.parse({
        messageId: 1,
        sessionId: "session-1",
        sender: "BOT",
        content: "안녕",
        sentAt: "2026-09-22T00:00:00",
      }),
    ).toThrow();
  });

  it("히스토리는 배열이다", () => {
    const parsed = chatHistoryDto.parse([
      {
        messageId: 1,
        sessionId: "session-1",
        sender: "USER",
        content: "안녕",
        sentAt: "2026-09-22T00:00:00",
      },
    ]);
    expect(parsed).toHaveLength(1);
  });
});
