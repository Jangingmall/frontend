import { type DefaultBodyType, http, type PathParams } from "msw";

import type { ChatMessageDto } from "@/api/chatbot/validation";
import { mockError, mockOk } from "@/mocks/envelope";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";

import {
  buildRecommendProducts,
  CHAT_SESSIONS,
  nextChatMessageId,
} from "./fixtures";

type Envelope = ApiResponse<unknown> | ApiErrorResponse;

function buildBotReply() {
  return {
    reply: "셰프 친구분의 개업은 정말 축하할 일이네요!\n말씀해주신 내용을 바탕으로 한식당의 분위기를 살려줄 실용적인 선물로 3점을 골랐어요.\n\n청자 분청 찻잔은 부산 사기장의 국가무형유산 작품으로 손님 접대에 바로 쓸 수 있고, 도기토 수반은 공간에 운치를 더하며, 오배자염 테이블러너는 이천 명장의 작품으로 테이블을 정갈하게 완성해 줍니다.",
    intent: "gift_recommendation",
    suggestions: [] as string[],
    products: buildRecommendProducts(),
  };
}

export const chatbotHandlers = [
  http.post<PathParams, DefaultBodyType, Envelope>(
    "*/api/chatbot/sessions",
    () => {
      const sessionId = crypto.randomUUID();
      CHAT_SESSIONS.set(sessionId, { ended: false, messages: [] });
      return mockOk({ sessionId, expiresInSeconds: 3600 }, 201);
    },
  ),

  http.post<PathParams, DefaultBodyType, Envelope>(
    "*/api/chatbot/sessions/:sessionId/messages",
    async ({ params, request }) => {
      const sessionId = String(params.sessionId);
      const session = CHAT_SESSIONS.get(sessionId);
      if (!session)
        return mockError(404, "NOT_FOUND", "세션을 찾을 수 없어요.");
      if (session.ended)
        return mockError(
          422,
          "BUSINESS_RULE_VIOLATION",
          "이미 종료된 세션이에요.",
        );

      const body = (await request.json()) as { content: string };
      const now = new Date().toISOString();

      const userMessage: ChatMessageDto = {
        messageId: nextChatMessageId(),
        sessionId,
        sender: "USER",
        content: body.content,
        sentAt: now,
      };
      session.messages.push(userMessage);

      const botReply = buildBotReply();
      const botMessageId = nextChatMessageId();
      const botMessage: ChatMessageDto = {
        messageId: botMessageId,
        sessionId,
        sender: "ADMIN",
        content: botReply.reply,
        sentAt: now,
      };
      session.messages.push(botMessage);

      return mockOk(
        {
          sessionId,
          messageId: botMessageId,
          ...botReply,
        },
        201,
      );
    },
  ),

  http.get<PathParams, DefaultBodyType, Envelope>(
    "*/api/chatbot/sessions/:sessionId/messages",
    ({ params }) => {
      const sessionId = String(params.sessionId);
      const session = CHAT_SESSIONS.get(sessionId);
      if (!session)
        return mockError(404, "NOT_FOUND", "세션을 찾을 수 없어요.");
      if (session.ended)
        return mockError(
          422,
          "BUSINESS_RULE_VIOLATION",
          "이미 종료된 세션이에요.",
        );
      return mockOk(session.messages);
    },
  ),

  http.delete<PathParams, DefaultBodyType, Envelope>(
    "*/api/chatbot/sessions/:sessionId",
    ({ params }) => {
      const sessionId = String(params.sessionId);
      const session = CHAT_SESSIONS.get(sessionId);
      if (!session)
        return mockError(404, "NOT_FOUND", "세션을 찾을 수 없어요.");
      session.ended = true;
      return mockOk(null);
    },
  ),
];
