"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchChatHistory } from "@/api/chatbot/api";

import { chatbotKeys } from "./keys";

/**
 * `sessionStorage`에 캐싱해둔 세션이 서버에서 아직 유효한지 확인하는 용도로만 쓴다 —
 * 응답의 메시지 목록 자체는 화면 복원에 쓰지 않는다(히스토리 GET엔 상품 카드·제안 칩이
 * 없어서, docs/api-contract.md §7). 성공/실패 여부만 본다.
 */
export function useChatHistoryQuery(
  sessionId: string | null,
  userId: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: chatbotKeys.history(sessionId ?? "", userId),
    queryFn: () => fetchChatHistory(sessionId as string),
    enabled: enabled && !!sessionId,
    retry: false,
  });
}
