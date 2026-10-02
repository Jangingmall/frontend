import { clientFetch } from "@/lib/http/client";
import type { ChatMessage } from "@/types/chatbot";

import { mapChatHistory, mapChatSendResultToBotMessage } from "./mapper";
import {
  chatHistoryDto,
  chatSendResultDto,
  chatSessionDto,
} from "./validation";

/**
 * 현재 소비자 시연은 로그인 여부 및 API 모드와 무관하게 고정 추천을 사용한다.
 * 실제 계약(/api/chatbot) 대신 명시적인 MSW 전용 주소를 사용하며 인증 토큰은 전송하지 않는다.
 * 실서비스 추천을 재개할 때는 세션 생성·전송·조회·종료 경로를 함께 전환해야 한다.
 */
export async function createChatSession(): Promise<{
  sessionId: string;
  expiresInSeconds: number;
}> {
  const data = await clientFetch<unknown>("/api/mock/chatbot/sessions", {
    method: "POST",
  });
  return chatSessionDto.parse(data);
}

/**
 * `POST /api/mock/chatbot/sessions/{sessionId}/messages`. 봇 답변만 `ChatMessage`로 변환해
 * 돌려준다 — 사용자 메시지 쪽은 호출부가 이미 낙관적으로 붙여둔다(`mapper.ts` 참고).
 */
export async function sendChatMessage(
  sessionId: string,
  content: string,
): Promise<ChatMessage> {
  const data = await clientFetch<unknown>(
    `/api/mock/chatbot/sessions/${sessionId}/messages`,
    { method: "POST", body: { content } },
  );
  return mapChatSendResultToBotMessage(chatSendResultDto.parse(data));
}

/**
 * `GET /api/mock/chatbot/sessions/{sessionId}/messages` — 화면 복원에는 쓰지 않는다. 로컬
 * `sessionStorage` 캐시가 서버에서 아직 유효한지 확인하는 용도로만 호출한다.
 */
export async function fetchChatHistory(
  sessionId: string,
): Promise<ChatMessage[]> {
  const data = await clientFetch<unknown>(
    `/api/mock/chatbot/sessions/${sessionId}/messages`,
  );
  return mapChatHistory(chatHistoryDto.parse(data));
}

/** `DELETE /api/mock/chatbot/sessions/{sessionId}` — 종료 확인 모달에서 "종료" 확정 시에만. */
export async function endChatSession(sessionId: string): Promise<void> {
  await clientFetch<null>(`/api/mock/chatbot/sessions/${sessionId}`, {
    method: "DELETE",
  });
}
