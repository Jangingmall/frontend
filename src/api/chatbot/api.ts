import { clientFetch } from "@/lib/http/client";
import type { ChatMessage } from "@/types/chatbot";

import { mapChatHistory, mapChatSendResultToBotMessage } from "./mapper";
import {
  chatHistoryDto,
  chatSendResultDto,
  chatSessionDto,
} from "./validation";

/** `POST /api/chatbot/sessions` — 인증(USER) 필요. (docs/api-contract.md §7) */
export async function createChatSession(): Promise<{
  sessionId: string;
  expiresInSeconds: number;
}> {
  const data = await clientFetch<unknown>("/api/chatbot/sessions", {
    method: "POST",
  });
  return chatSessionDto.parse(data);
}

/**
 * `POST /api/chatbot/sessions/{sessionId}/messages`. 봇 답변만 `ChatMessage`로 변환해
 * 돌려준다 — 사용자 메시지 쪽은 호출부가 이미 낙관적으로 붙여둔다(`mapper.ts` 참고).
 */
export async function sendChatMessage(
  sessionId: string,
  content: string,
): Promise<ChatMessage> {
  const data = await clientFetch<unknown>(
    `/api/chatbot/sessions/${sessionId}/messages`,
    { method: "POST", body: { content } },
  );
  return mapChatSendResultToBotMessage(chatSendResultDto.parse(data));
}

/**
 * `GET /api/chatbot/sessions/{sessionId}/messages` — 화면 복원에는 쓰지 않는다. 로컬
 * `sessionStorage` 캐시가 서버에서 아직 유효한지 확인하는 용도로만 호출한다.
 */
export async function fetchChatHistory(
  sessionId: string,
): Promise<ChatMessage[]> {
  const data = await clientFetch<unknown>(
    `/api/chatbot/sessions/${sessionId}/messages`,
  );
  return mapChatHistory(chatHistoryDto.parse(data));
}

/** `DELETE /api/chatbot/sessions/{sessionId}` — 종료 확인 모달에서 "종료" 확정 시에만. */
export async function endChatSession(sessionId: string): Promise<void> {
  await clientFetch<null>(`/api/chatbot/sessions/${sessionId}`, {
    method: "DELETE",
  });
}
