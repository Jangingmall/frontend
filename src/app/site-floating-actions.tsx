"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChatPanel } from "@/components/chatbot/ChatPanel";
import { FloatingActions } from "@/components/common/floating-actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  CHAT_SUGGESTION_DISPLAY_COUNT,
  CHAT_SUGGESTION_POOL,
} from "@/constants/chatbot";
import { ApiError } from "@/lib/http/api-error";
import {
  useCreateChatSessionMutation,
  useEndChatSessionMutation,
  useSendChatMessageMutation,
} from "@/queries/chatbot/mutations";
import { useChatHistoryQuery } from "@/queries/chatbot/queries";
import { useAuthStore } from "@/stores/auth";
import type { ChatMessage } from "@/types/chatbot";
import { pickRandomSample } from "@/utils/random";

// 세션 관련 에러 3종 — SESSION_NOT_FOUND(404) · SESSION_ALREADY_ENDED(422) ·
// SESSION_FORBIDDEN(403), docs/api-contract.md §7. 검증(historyCheck) 통과 후에도
// 세션이 나중에 만료·종료·소유권 변경될 수 있어, 전송 자체의 실패에서도 이 상태 코드를
// 보고 죽은 세션을 버려야 한다(그렇지 않으면 재시도가 같은 세션을 영원히 재사용한다).
const SESSION_INVALID_STATUSES = new Set([403, 404, 422]);

interface StoredSession {
  sessionId: string;
  messages: ChatMessage[];
}

// `sessionStorage` 키에 `userId`를 포함한다 — 계정별로 격리하지 않으면 로그아웃 후 다른
// 계정으로 로그인해도 이전 계정의 대화가 그대로 남아있다(리뷰 지적). `userId`가 없으면
// (게스트·부팅 중) 애초에 챗봇 세션을 만들 수 없으니 저장소 자체를 건드리지 않는다.
function sessionStorageKey(userId: number | null): string | null {
  return userId == null ? null : `chatbot-session:${userId}`;
}

function readStoredSession(userId: number | null): StoredSession | null {
  const key = sessionStorageKey(userId);
  if (typeof window === "undefined" || !key) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.sessionId || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(
  userId: number | null,
  session: StoredSession | null,
) {
  const key = sessionStorageKey(userId);
  if (typeof window === "undefined" || !key) return;
  if (!session) {
    window.sessionStorage.removeItem(key);
    return;
  }
  window.sessionStorage.setItem(key, JSON.stringify(session));
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

export function SiteFloatingActions(props: SiteFloatingActionsProps) {
  const status = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  // 계정이 바뀌면(로그아웃 후 다른 계정 로그인, `mock-identity-switcher.tsx`처럼
  // 네비게이션 없이 계정만 바뀌는 경로 포함) 내부 `sessionId`·`messages`·
  // `initialCachedSessionId` state가 저절로 리셋되지 않는다 — `key`로 강제
  // 리마운트시켜야 한다(리뷰 지적).
  return <SiteFloatingActionsInner key={userId ?? status} {...props} />;
}

function SiteFloatingActionsInner({
  showAiChat = true,
}: SiteFloatingActionsProps) {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.user?.role);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const router = useRouter();
  const chatPanelRef = useRef<HTMLDivElement>(null);
  // 판매자도 백엔드 ROLE_USER 권한을 포함하므로 기존 추천 챗봇을 사용할 수 있다.
  const isWrongRole =
    status === "authenticated" && role !== "USER" && role !== "ARTISAN";

  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  // sessionStorage 캐시는 lazy initializer로 한 번만 동기 읽기 — 마운트 후 effect로
  // 따라 채우면 setState-in-effect(cascading render, react-hooks/set-state-in-effect)에
  // 걸린다. `mock-identity-switcher.tsx`가 남긴 것과 같은 이유로, 브라우저 저장소 값은
  // effect가 아니라 이렇게 동기적으로 읽는 쪽이 React가 권장하는 경로다.
  //
  // 계정이 바뀌면(로그아웃 후 다른 계정 로그인 등) 이 state들은 저절로 안 바뀐다 —
  // `userId`가 바뀌었다고 재계산되는 게 아니라 "마운트 시점 한 번"만 읽는다. 그래서 위
  // 얇은 outer(`SiteFloatingActions`)가 `key={userId ?? status}`로 계정이 바뀔 때 이
  // 컴포넌트를 통째로 리마운트시킨다(리뷰 지적 — `mock-identity-switcher.tsx`처럼
  // 네비게이션 없이 계정만 바뀌는 경로가 실제로 있다). 리마운트되면 아래 lazy
  // initializer들이 새 `userId`로 다시 실행된다.
  const [sessionId, setSessionId] = useState<string | null>(
    () => readStoredSession(userId)?.sessionId ?? null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => readStoredSession(userId)?.messages ?? [],
  );
  // 마운트 시점에 캐시된 세션이 있었다면 그 sessionId를 한 번만 고정 캡처한다 — 검증
  // 대상은 오직 이 "원래 캐시됐던 세션"뿐이다. 이후 `handleSend`가 무효 판정을 받고
  // 새로 만든 세션은 이미 신뢰된 상태(그 자체로 방금 서버가 만들어준 것)라 검증이 필요
  // 없다. 단순 boolean(`hadCachedSession`)이었을 때는 이 구분이 없어서, 새 세션으로
  // `sessionId`가 바뀌어도 그 새 세션까지 `historyCheck`가 다시 돌며 "검증 전"으로
  // 취급해 방금 막 주고받은 정상 대화가 잠깐(또는 검증 실패 시 계속) 사라지는 문제가
  // 있었다(리뷰 지적).
  const [initialCachedSessionId] = useState(
    () => readStoredSession(userId)?.sessionId ?? null,
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
  // 세션 생성이든 메시지 전송이든 하나가 진행 중이면 새 전송을 막는다 — 그렇지 않으면
  // 첫 전송의 세션 생성이 끝나기 전에 두 번째 전송이 각자 `sessionId === null`을 보고
  // 별도 세션을 만들어버린다(리뷰 지적).
  const isSending = createSession.isPending || sendMessage.isPending;
  // 유효성 검증 전용(§4-5, docs/api-contract.md §7) — 응답 메시지 목록은 화면 복원에 안 쓰고
  // `isError` 여부만 본다. 실패 시 로컬 state를 되돌리는 effect는 두지 않는다(위와 같은
  // 이유) — 대신 `handleSend`가 다음 전송 시점에 `historyCheck.isError`를 직접 보고 새
  // 세션을 만든다(data-layer.md §6.2 "isError 분기는 컴포넌트가 직접 한다"와 같은 결).
  const historyCheck = useChatHistoryQuery(
    sessionId,
    userId,
    status === "authenticated" &&
      !!sessionId &&
      sessionId === initialCachedSessionId,
  );
  // 캐시로 복원한 세션이 있었으면 검증(`historyCheck`)이 성공으로 끝나기 전까지는
  // 화면에 아예 안 보여준다 — "아직 실패로 안 밝혀졌다"와 "유효하다고 확인됐다"는 다르다.
  // 검증 중인 그 짧은 창에도 캐시된 대화를 그대로 보여주면 같은 탭에서 다른 계정으로
  // 로그인했을 때 이전 사용자 대화가 노출될 수 있다(리뷰 지적). 캐시가 아예 없었던
  // 경우(새 세션)나, `sessionId`가 이미 그 원래 캐시된 값과 달라진 경우(무효 판정 후
  // 새로 만든 세션)는 검증 대상이 아니므로 바로 보여준다.
  const isValidated =
    !initialCachedSessionId ||
    sessionId !== initialCachedSessionId ||
    historyCheck.isSuccess;
  const isStaleSession =
    sessionId === initialCachedSessionId &&
    !!initialCachedSessionId &&
    historyCheck.isError;
  const visibleMessages = isValidated ? messages : [];

  // 대화가 바뀔 때마다 캐시를 다시 저장한다. `setState`가 아니라 브라우저 저장소 쓰기라
  // set-state-in-effect 대상이 아니다.
  //
  // 응답을 아직 못 받았거나(`isSending`) 실패해서 매달린 채인(`lastFailedContent`)
  // 마지막 메시지는 서버가 실제로 받아들였는지 확정되지 않았다 — 이 상태에서 저장해두면
  // 그 타이밍에 새로고침/재마운트할 때 확인 없이 정상 대화처럼 복원돼버린다(리뷰 지적,
  // GET history는 세션 자체의 유효성만 볼 뿐 개별 메시지 전달 여부는 안 본다). 확정된
  // 마지막 완결 상태만 저장한다 — 요청이 settle되면 이 effect가 다시 돌면서 그 시점의
  // 최종 `messages`를 저장하므로 정상 흐름에서 유실되는 데이터는 없다.
  useEffect(() => {
    if (!sessionId || isSending || lastFailedContent !== null) return;
    writeStoredSession(userId, { sessionId, messages });
  }, [userId, sessionId, messages, isSending, lastFailedContent]);

  // 무효로 확인된 세션은 캐시에서도 즉시 지운다 — 새로고침해도 재사용되지 않게.
  useEffect(() => {
    if (isStaleSession && sessionId) writeStoredSession(userId, null);
  }, [isStaleSession, sessionId, userId]);

  function handleAiChatToggle() {
    if (isOpen) {
      setIsOpen(false); // 접기 — 세션·메시지 유지, 종료 아님
      return;
    }
    if (status === "loading" || isWrongRole) return; // 진입점이 이미 숨겨져 있는 방어용
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
    writeStoredSession(userId, null);
    setIsEndConfirmOpen(false);
    setIsOpen(false);
  }

  // 세션 생성 + 전송만 담당 — 사용자 버블은 건드리지 않는다. `handleSend`(새 메시지)와
  // `handleRetry`(이미 화면에 있는 실패한 사용자 버블 재시도)가 공유한다(§4-4 — 재시도는
  // 사용자 버블을 다시 추가하지 않고 봇 응답만 다시 요청한다).
  async function performSend(content: string, baseSessionId: string | null) {
    try {
      let currentSessionId = baseSessionId;
      if (!currentSessionId) {
        const session = await createSession.mutateAsync();
        currentSessionId = session.sessionId;
        setSessionId(currentSessionId);
      }
      const botMessage = await sendMessage.mutateAsync({
        sessionId: currentSessionId,
        content,
      });
      setMessages((prev) => [...prev, botMessage]);
      if (botMessage.suggestions) setSuggestions(botMessage.suggestions);
      setLastFailedContent(null);
    } catch (error) {
      // 검증을 통과했던 세션도 이후 다른 탭에서 종료되거나 자연 만료될 수 있다 — 이
      // 상태 코드를 보고 즉시 버려야 "다시 시도"가 같은 죽은 세션을 반복 호출하지 않고
      // 다음 시도에서 새 세션을 만든다.
      if (
        error instanceof ApiError &&
        SESSION_INVALID_STATUSES.has(error.status)
      ) {
        setSessionId(null);
        // 죽은 세션 시절 대화까지 새 세션 밑에 섞여 저장되면 안 된다(리뷰 지적) —
        // `isSending` 가드 덕분에 이 시점의 마지막 메시지는 항상 지금 재시도 중인
        // 사용자 버블 하나뿐이라, 그것만 남기고 그 이전 죽은 세션의 대화는 버린다.
        setMessages((prev) => prev.slice(-1));
      }
      setLastFailedContent(content);
    }
  }

  function handleSend(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;

    // 캐시로 복원한 세션이 서버에서 이미 무효(만료·종료·타인 소유)로 확인됐거나
    // (`isStaleSession`), 직전 전송 실패로 `performSend`가 이미 `sessionId`를 비워둔
    // 상태면(오류 배너에서 "다시 시도" 대신 새 질문을 보내는 경로, 리뷰 지적) 그 위에
    // 이어 쓰지 않고 완전히 새 대화로 시작한다 — 안 그러면 죽은 세션 시절의 실패 버블이
    // 새로 만들 세션 밑에 그대로 남는다.
    const startFresh = isStaleSession || sessionId === null;
    // 세션 자체는 멀쩡한데(5xx·네트워크 오류) 직전 전송만 실패해 매달린 버블이 남아있는
    // 경우도 있다 — 이땐 세션은 그대로 재사용하되(`startFresh`가 아니다) "다시 시도"
    // 대신 새 질문을 보내는 순간 그 매달린 실패 버블만 제거한다(리뷰 지적, `isSending`
    // 가드 덕에 그 실패 버블은 항상 `messages`의 마지막 원소다).
    const hasDanglingFailure = lastFailedContent !== null;
    const baseMessages = startFresh
      ? []
      : hasDanglingFailure
        ? messages.slice(0, -1)
        : messages;
    const baseSessionId = startFresh ? null : sessionId;
    if (isStaleSession) setSessionId(null);

    const userMessage: ChatMessage = {
      id: Date.now(),
      sessionId: baseSessionId ?? "",
      sender: "user",
      content: trimmed,
      sentAt: new Date().toISOString(),
    };
    setMessages([...baseMessages, userMessage]);
    setInputValue("");

    void performSend(trimmed, baseSessionId);
  }

  function handleRetry() {
    if (!lastFailedContent || isSending) return;
    if (isStaleSession) setSessionId(null);
    void performSend(lastFailedContent, isStaleSession ? null : sessionId);
  }

  return (
    <>
      <FloatingActions
        showAiChat={showAiChat && !isWrongRole}
        isChatOpen={isOpen}
        onAiChatToggle={handleAiChatToggle}
      />
      {isOpen && (
        <ChatPanel
          ref={chatPanelRef}
          messages={visibleMessages}
          isSending={isSending}
          sendError={sendMessage.isError || createSession.isError}
          onRetry={handleRetry}
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
        container={chatPanelRef}
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
