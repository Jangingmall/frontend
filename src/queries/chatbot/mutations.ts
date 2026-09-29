"use client";

import { useMutation } from "@tanstack/react-query";

import {
  createChatSession,
  endChatSession,
  sendChatMessage,
} from "@/api/chatbot/api";

/** 지연 생성 — 패널을 여는 것만으론 세션을 만들지 않고, 첫 메시지 전송 시점에 호출한다. */
export function useCreateChatSessionMutation() {
  return useMutation({
    mutationFn: () => createChatSession(),
  });
}

/**
 * 실패(네트워크 오류·세션 만료 3종)는 호출부가 `isError`로 인라인 오류 배너를 표시한다
 * (docs/api-contract.md §7, "다시 시도" 버튼). throw하지 않는다.
 */
export function useSendChatMessageMutation() {
  return useMutation({
    mutationFn: ({
      sessionId,
      content,
    }: {
      sessionId: string;
      content: string;
    }) => sendChatMessage(sessionId, content),
  });
}

/** 종료 확인 모달에서 "종료"를 확정한 시점에만 호출한다. */
export function useEndChatSessionMutation() {
  return useMutation({
    mutationFn: (sessionId: string) => endChatSession(sessionId),
  });
}
