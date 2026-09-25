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

const NO_RESULT_REPLY =
  "조건에 맞는 상품을 찾지 못했어요. 조건을 바꿔서 다시 찾아볼까요?";
const NO_RESULT_SUGGESTIONS = ["질문 추천 1", "질문 추천 2", "질문 추천 3"];
const GENERIC_REPLY = "무엇을 도와드릴까요?";
const GENERIC_SUGGESTIONS = ["신상품 보여줘", "베스트 상품 추천해줘"];

function buildBotReply(content: string) {
  if (content.includes("선물") || content.includes("추천")) {
    return {
      reply: "요청하신 조건에 맞는 상품을 몇 가지 골라봤어요.",
      intent: null,
      suggestions: [] as string[],
      products: buildRecommendProducts(),
    };
  }
  if (
    content.includes("없는") ||
    content.includes("없음") ||
    content.includes("품절")
  ) {
    return {
      reply: NO_RESULT_REPLY,
      intent: null,
      suggestions: NO_RESULT_SUGGESTIONS,
      products: [],
    };
  }
  return {
    reply: GENERIC_REPLY,
    intent: null,
    suggestions: GENERIC_SUGGESTIONS,
    products: [],
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

      const botReply = buildBotReply(body.content);
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
