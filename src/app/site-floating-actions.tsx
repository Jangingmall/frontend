"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ChatPanel } from "@/components/chatbot/ChatPanel";
import { FloatingActions } from "@/components/common/floating-actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  CHAT_SUGGESTION_DISPLAY_COUNT,
  CHAT_SUGGESTION_POOL,
} from "@/constants/chatbot";
import {
  useCreateChatSessionMutation,
  useEndChatSessionMutation,
  useSendChatMessageMutation,
} from "@/queries/chatbot/mutations";
import { useChatHistoryQuery } from "@/queries/chatbot/queries";
import { useAuthStore } from "@/stores/auth";
import type { ChatMessage } from "@/types/chatbot";
import { pickRandomSample } from "@/utils/random";

const SESSION_STORAGE_KEY = "chatbot-session";

interface StoredSession {
  sessionId: string;
  messages: ChatMessage[];
}

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.sessionId || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

/**
 * `FloatingActions`·`ChatPanel`과 `stores/auth`·`queries/chatbot`을 잇는 접합부
 * (`site-gnb.tsx`와 동일한 이유 — `docs/architecture.md` §8.2, `components/common/`·
 * `components/chatbot/`은 store·query를 직접 참조하지 않는다). 호출부는 `showAiChat=true`인
 * 화면(홈·상품 목록)마다 이 컴포넌트를 쓴다.
 */
interface SiteFloatingActionsProps {
  showAiChat?: boolean;
}

export function SiteFloatingActions({
  showAiChat = true,
}: SiteFloatingActionsProps) {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  // sessionStorage 캐시는 lazy initializer로 한 번만 동기 읽기 — 마운트 후 effect로
  // 따라 채우면 setState-in-effect(cascading render, react-hooks/set-state-in-effect)에
  // 걸린다. `mock-identity-switcher.tsx`가 남긴 것과 같은 이유로, 브라우저 저장소 값은
  // effect가 아니라 이렇게 동기적으로 읽는 쪽이 React가 권장하는 경로다.
  const [sessionId, setSessionId] = useState<string | null>(
    () => readStoredSession()?.sessionId ?? null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => readStoredSession()?.messages ?? [],
  );
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    pickRandomSample(CHAT_SUGGESTION_POOL, CHAT_SUGGESTION_DISPLAY_COUNT),
  );
  const [lastFailedContent, setLastFailedContent] = useState<string | null>(
    null,
  );

  const createSession = useCreateChatSessionMutation();
  const sendMessage = useSendChatMessageMutation();
  const endSession = useEndChatSessionMutation();
  // 유효성 검증 전용(§4-5, docs/api-contract.md §7) — 응답 메시지 목록은 화면 복원에 안 쓰고
  // `isError` 여부만 본다. 실패 시 로컬 state를 되돌리는 effect는 두지 않는다(위와 같은
  // 이유) — 대신 `handleSend`가 다음 전송 시점에 `historyCheck.isError`를 직접 보고 새
  // 세션을 만든다(data-layer.md §6.2 "isError 분기는 컴포넌트가 직접 한다"와 같은 결).
  const historyCheck = useChatHistoryQuery(
    sessionId,
    status === "authenticated" && !!sessionId,
  );

  // 대화가 바뀔 때마다 캐시를 다시 저장한다. `setState`가 아니라 브라우저 저장소 쓰기라
  // set-state-in-effect 대상이 아니다.
  useEffect(() => {
    if (!sessionId) return;
    writeStoredSession({ sessionId, messages });
  }, [sessionId, messages]);

  function handleAiChatToggle() {
    if (isOpen) {
      setIsOpen(false); // 접기 — 세션·메시지 유지, 종료 아님
      return;
    }
    if (status === "loading") return;
    if (status !== "authenticated") {
      setIsLoginOpen(true);
      return;
    }
    setIsOpen(true);
  }

  function handleLogin() {
    const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const loginUrl =
      `/login?returnUrl=${encodeURIComponent(encodeURIComponent(returnUrl))}` as const;
    if (window.location.hash) window.location.assign(loginUrl);
    else router.push(loginUrl);
  }

  function handleRequestClose() {
    setIsEndConfirmOpen(true);
  }

  async function handleConfirmEnd() {
    if (sessionId) {
      try {
        await endSession.mutateAsync(sessionId);
      } catch {
        // 종료 API 실패해도 로컬 상태는 그대로 초기화한다 — 어차피 세션은
        // `expiresInSeconds` 경과 후 서버에서도 자연 만료된다.
      }
    }
    setSessionId(null);
    setMessages([]);
    writeStoredSession(null);
    setIsEndConfirmOpen(false);
    setIsOpen(false);
  }

  async function handleSend(content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;

    // 캐시로 복원한 세션이 서버에서 이미 무효(만료·종료·타인 소유)로 확인됐으면, 그 위에
    // 이어 쓰지 않고 여기서 완전히 새 대화로 되돌린다.
    const isStaleSession = historyCheck.isError;
    const baseMessages = isStaleSession ? [] : messages;
    const baseSessionId = isStaleSession ? null : sessionId;
    if (isStaleSession) writeStoredSession(null);

    const userMessage: ChatMessage = {
      id: Date.now(),
      sessionId: baseSessionId ?? "",
      sender: "user",
      content: trimmed,
      sentAt: new Date().toISOString(),
    };
    setMessages([...baseMessages, userMessage]);
    setInputValue("");

    try {
      let currentSessionId = baseSessionId;
      if (!currentSessionId) {
        const session = await createSession.mutateAsync();
        currentSessionId = session.sessionId;
        setSessionId(currentSessionId);
      }
      const botMessage = await sendMessage.mutateAsync({
        sessionId: currentSessionId,
        content: trimmed,
      });
      setMessages((prev) => [...prev, botMessage]);
      if (botMessage.suggestions) setSuggestions(botMessage.suggestions);
      setLastFailedContent(null);
    } catch {
      setLastFailedContent(trimmed);
    }
  }

  return (
    <>
      <FloatingActions
        showAiChat={showAiChat}
        isChatOpen={isOpen}
        onAiChatToggle={handleAiChatToggle}
      />
      {isOpen && (
        <ChatPanel
          messages={messages}
          isSending={createSession.isPending || sendMessage.isPending}
          sendError={sendMessage.isError}
          onRetry={() => lastFailedContent && handleSend(lastFailedContent)}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={() => handleSend(inputValue)}
          suggestions={suggestions}
          onSuggestionClick={handleSend}
          onReshuffleSuggestions={() =>
            setSuggestions(
              pickRandomSample(
                CHAT_SUGGESTION_POOL,
                CHAT_SUGGESTION_DISPLAY_COUNT,
              ),
            )
          }
          onRequestClose={handleRequestClose}
        />
      )}
      <Dialog
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        title="로그인 후 이용 가능한 서비스입니다"
        description="로그인 페이지로 이동하시겠습니까?"
        variant="confirmation"
      >
        <div className="flex gap-2.5">
          <Button
            variant="jade"
            size="xl"
            className="flex-1 border-border-neutral-subtle"
            onClick={() => setIsLoginOpen(false)}
          >
            취소
          </Button>
          <Button
            variant="solid"
            size="xl"
            className="flex-1"
            onClick={() => {
              setIsLoginOpen(false);
              handleLogin();
            }}
          >
            로그인하기
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={isEndConfirmOpen}
        onOpenChange={setIsEndConfirmOpen}
        title="종료 시 챗봇 대화 내역은 모두 삭제됩니다."
        description="챗봇을 종료하시겠습니까?"
        variant="confirmation"
      >
        <div className="flex gap-2.5">
          <Button
            variant="jade"
            size="xl"
            className="flex-1 border-border-neutral-subtle"
            onClick={() => setIsEndConfirmOpen(false)}
          >
            취소
          </Button>
          <Button
            variant="solid"
            size="xl"
            className="flex-1"
            onClick={handleConfirmEnd}
          >
            종료
          </Button>
        </div>
      </Dialog>
    </>
  );
}
