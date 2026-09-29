import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CHAT_SESSIONS } from "@/api/chatbot/mock/fixtures";
import { mockError } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { SiteFloatingActions } from "./site-floating-actions";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
  window.sessionStorage.clear();
  useAuthStore.getState().clear();
});

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <SiteFloatingActions />
    </QueryClientProvider>,
  );
}

function login() {
  useAuthStore.setState({
    status: "authenticated",
    accessToken: "token",
    user: { id: 1, name: "김미담", role: "USER" },
  });
}

describe("SiteFloatingActions", () => {
  it("USER가 아닌 인증 계정(ARTISAN)에는 챗봇 진입점이 숨겨진다", () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "token",
      user: { id: 2, name: "김도예", role: "ARTISAN" },
    });
    setup();

    expect(
      screen.queryByRole("button", { name: "미담 챗봇" }),
    ).not.toBeInTheDocument();
  });

  it("비로그인 상태에서 챗봇 버튼을 누르면 로그인 유도 다이얼로그가 뜬다", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));

    expect(
      screen.getByText("로그인 후 이용 가능한 서비스입니다"),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("궁금한 내용을 입력해주세요."),
    ).not.toBeInTheDocument();
  });

  it("로그인 다이얼로그에서 로그인하기를 누르면 returnUrl과 함께 /login으로 이동한다", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));
    fireEvent.click(screen.getByRole("button", { name: "로그인하기" }));

    expect(push).toHaveBeenCalledWith(
      expect.stringContaining("/login?returnUrl="),
    );
  });

  it("로그인 상태에서 챗봇 버튼을 누르면 패널이 열린다", () => {
    login();
    setup();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));

    expect(
      screen.getByPlaceholderText("궁금한 내용을 입력해주세요."),
    ).toBeInTheDocument();
  });

  it("캐시된 세션은 검증 전/실패 시 이전 대화를 화면에 보여주지 않는다", async () => {
    login();
    // 같은 계정의 브라우저 sessionStorage에 실제로는 존재하지 않는(또는 이미 무효화된)
    // 세션이 남아있다고 가정한다.
    window.sessionStorage.setItem(
      "chatbot-session:1",
      JSON.stringify({
        sessionId: "stale-session",
        messages: [
          {
            id: 1,
            sessionId: "stale-session",
            sender: "user",
            content: "이전 사용자 메시지",
            sentAt: new Date().toISOString(),
          },
        ],
      }),
    );
    setup();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));

    // 검증(GET history)이 끝나기 전인 이 시점에도 이전 대화가 보이면 안 된다.
    expect(screen.queryByText("이전 사용자 메시지")).not.toBeInTheDocument();

    // 검증 실패 후에는 캐시 자체도 지워진다.
    await waitFor(() =>
      expect(window.sessionStorage.getItem("chatbot-session:1")).toBeNull(),
    );
    expect(screen.queryByText("이전 사용자 메시지")).not.toBeInTheDocument();
  });

  it("계정을 전환하면(네비게이션 없이) 이전 계정의 대화가 새 계정에 보이지 않는다", async () => {
    // `mock-identity-switcher.tsx`가 하는 것과 같은 경로 — 페이지 이동 없이
    // `useAuthStore`만 직접 바꾼다. 컴포넌트가 언마운트되지 않아도 대화가 새지 않아야 한다.
    login();
    setup();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));
    const input = screen.getByPlaceholderText("궁금한 내용을 입력해주세요.");
    fireEvent.change(input, { target: { value: "A의 비밀 이야기" } });
    fireEvent.click(screen.getByRole("button", { name: "전송" }));
    await waitFor(() =>
      expect(screen.getByText("무엇을 도와드릴까요?")).toBeInTheDocument(),
    );

    // 네비게이션 없이 다른 계정(B)으로 전환한다.
    act(() => {
      useAuthStore.setState({
        status: "authenticated",
        accessToken: "token-b",
        user: { id: 2, name: "박미담", role: "USER" },
      });
    });

    // 리마운트로 패널은 닫힌 초기 상태로 돌아간다 — 다시 열어도 A의 대화가 없어야 한다.
    expect(
      screen.queryByPlaceholderText("궁금한 내용을 입력해주세요."),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));
    expect(screen.queryByText("A의 비밀 이야기")).not.toBeInTheDocument();
    expect(screen.getByText(/안녕하세요, 미담AI입니다/)).toBeInTheDocument();
  });

  it("첫 메시지를 보내면 세션이 지연 생성되고 봇 응답이 온다", async () => {
    login();
    setup();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));

    const input = screen.getByPlaceholderText("궁금한 내용을 입력해주세요.");
    fireEvent.change(input, { target: { value: "안녕" } });
    fireEvent.click(screen.getByRole("button", { name: "전송" }));

    expect(screen.getByText("안녕")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("무엇을 도와드릴까요?")).toBeInTheDocument(),
    );
  });

  it("첫 전송이 끝나기 전에 다시 제출해도 세션은 한 번만 생성된다", async () => {
    login();
    let createCount = 0;
    server.use(
      http.post("*/api/chatbot/sessions", async () => {
        createCount += 1;
        const sessionId = `session-${createCount}`;
        await delay(30);
        CHAT_SESSIONS.set(sessionId, { ended: false, messages: [] });
        return HttpResponse.json(
          {
            success: true,
            status: 201,
            data: { sessionId, expiresInSeconds: 3600 },
          },
          { status: 201 },
        );
      }),
    );
    setup();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));

    const input = screen.getByPlaceholderText("궁금한 내용을 입력해주세요.");
    const form = input.closest("form") as HTMLFormElement;
    fireEvent.change(input, { target: { value: "첫번째 질문" } });
    fireEvent.submit(form);
    // 첫 요청(세션 생성)이 아직 끝나지 않은 시점에 곧바로 다시 제출을 시도한다.
    fireEvent.change(input, { target: { value: "두번째 질문" } });
    fireEvent.submit(form);

    await waitFor(() =>
      expect(screen.getByText("무엇을 도와드릴까요?")).toBeInTheDocument(),
    );
    expect(createCount).toBe(1);
  });

  it("전송 중 세션이 무효화되면(404) 재시도가 새 세션을 만든다", async () => {
    login();
    let createCount = 0;
    let messageAttempt = 0;
    server.use(
      http.post("*/api/chatbot/sessions", () => {
        createCount += 1;
        const sessionId = `session-${createCount}`;
        CHAT_SESSIONS.set(sessionId, { ended: false, messages: [] });
        return HttpResponse.json(
          {
            success: true,
            status: 201,
            data: { sessionId, expiresInSeconds: 3600 },
          },
          { status: 201 },
        );
      }),
      http.post("*/api/chatbot/sessions/:sessionId/messages", ({ params }) => {
        messageAttempt += 1;
        // 첫 시도는 세션이 이미 만료된 것처럼 404를 낸다 — historyCheck는 아직 이
        // 세션을 검증하지도 않은 새 세션이라 `isStaleSession`으로는 못 잡는 경우다.
        if (messageAttempt === 1) return mockError(404, "SESSION_NOT_FOUND");
        return HttpResponse.json(
          {
            success: true,
            status: 201,
            data: {
              sessionId: String(params.sessionId),
              messageId: 1,
              reply: "무엇을 도와드릴까요?",
              intent: null,
              suggestions: [],
              products: [],
            },
          },
          { status: 201 },
        );
      }),
    );
    setup();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));
    const input = screen.getByPlaceholderText("궁금한 내용을 입력해주세요.");
    fireEvent.change(input, { target: { value: "안녕" } });
    fireEvent.click(screen.getByRole("button", { name: "전송" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() =>
      expect(screen.getByText("무엇을 도와드릴까요?")).toBeInTheDocument(),
    );
    // 죽은 세션을 재사용하지 않고 재시도에서 새 세션을 만들었어야 한다.
    expect(createCount).toBe(2);
  });

  it("무효 세션 재시도 후 이전(죽은 세션) 대화가 새 세션에 섞이지 않는다", async () => {
    login();
    let createCount = 0;
    let messageAttempt = 0;
    server.use(
      http.post("*/api/chatbot/sessions", () => {
        createCount += 1;
        const sessionId = `session-${createCount}`;
        CHAT_SESSIONS.set(sessionId, { ended: false, messages: [] });
        return HttpResponse.json(
          {
            success: true,
            status: 201,
            data: { sessionId, expiresInSeconds: 3600 },
          },
          { status: 201 },
        );
      }),
      http.post("*/api/chatbot/sessions/:sessionId/messages", ({ params }) => {
        messageAttempt += 1;
        // 두 번째 실제 전송에서 세션이 만료된 것처럼 404를 낸다 — 그 전에 이미
        // 정상적으로 한 번 주고받은 대화가 있는 상태다.
        if (messageAttempt === 2) return mockError(404, "SESSION_NOT_FOUND");
        return HttpResponse.json(
          {
            success: true,
            status: 201,
            data: {
              sessionId: String(params.sessionId),
              messageId: messageAttempt,
              reply: `답변 ${messageAttempt}`,
              intent: null,
              suggestions: [],
              products: [],
            },
          },
          { status: 201 },
        );
      }),
    );
    setup();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));
    const input = screen.getByPlaceholderText("궁금한 내용을 입력해주세요.");

    fireEvent.change(input, { target: { value: "첫번째 질문" } });
    fireEvent.click(screen.getByRole("button", { name: "전송" }));
    await waitFor(() => expect(screen.getByText("답변 1")).toBeInTheDocument());

    fireEvent.change(input, { target: { value: "두번째 질문" } });
    fireEvent.click(screen.getByRole("button", { name: "전송" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      ).toBeInTheDocument(),
    );
    // 죽은 세션의 이전 대화는 이 시점에 이미 화면에서 사라져 있어야 한다.
    expect(screen.queryByText("첫번째 질문")).not.toBeInTheDocument();
    expect(screen.queryByText("답변 1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(screen.getByText("답변 3")).toBeInTheDocument());
    expect(screen.getByText("두번째 질문")).toBeInTheDocument();
    expect(screen.queryByText("첫번째 질문")).not.toBeInTheDocument();
    expect(screen.queryByText("답변 1")).not.toBeInTheDocument();
    expect(createCount).toBe(2);
  });

  it("접기는 대화를 유지하고, 헤더 종료는 확인 모달을 거쳐야 실제로 초기화된다", async () => {
    login();
    setup();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));
    const input = screen.getByPlaceholderText("궁금한 내용을 입력해주세요.");
    fireEvent.change(input, { target: { value: "안녕" } });
    fireEvent.click(screen.getByRole("button", { name: "전송" }));
    await waitFor(() =>
      expect(screen.getByText("무엇을 도와드릴까요?")).toBeInTheDocument(),
    );

    // 접기 — 대화 유지.
    fireEvent.click(screen.getByRole("button", { name: "챗봇 패널 접기" }));
    expect(
      screen.queryByPlaceholderText("궁금한 내용을 입력해주세요."),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));
    expect(screen.getByText("안녕")).toBeInTheDocument();

    // 헤더 종료 — 확인 모달이 먼저 뜬다. 취소하면 대화가 그대로 유지된다.
    fireEvent.click(screen.getByRole("button", { name: "챗봇 종료" }));
    expect(
      screen.getByText("종료 시 챗봇 대화 내역은 모두 삭제됩니다."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.getByText("안녕")).toBeInTheDocument();

    // 종료 확정 — 패널이 닫히고, 다시 열면 새 대화(인사 화면)로 시작한다.
    fireEvent.click(screen.getByRole("button", { name: "챗봇 종료" }));
    fireEvent.click(screen.getByRole("button", { name: "종료" }));
    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText("궁금한 내용을 입력해주세요."),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));
    expect(screen.queryByText("안녕")).not.toBeInTheDocument();
    expect(screen.getByText(/안녕하세요, 미담AI입니다/)).toBeInTheDocument();
  });

  it("전송이 실패하면 오류 배너가 뜨고 다시 시도로 재전송한다", async () => {
    login();
    // 세션 생성은 기본 목업(`CHAT_SESSIONS`에 실제로 등록됨)을 그대로 쓴다 — 고정
    // sessionId로 오버라이드하면 유효성 검증(GET history)이 그 id를 못 찾아 404를 내고,
    // 그러면 F1 수정(무효 세션 즉시 화면 숨김)이 재시도 응답까지 함께 가려버린다.
    let attempt = 0;
    server.use(
      http.post("*/api/chatbot/sessions/:sessionId/messages", ({ params }) => {
        attempt += 1;
        if (attempt === 1) return mockError(500, "INTERNAL_ERROR");
        return HttpResponse.json(
          {
            success: true,
            status: 201,
            data: {
              sessionId: String(params.sessionId),
              messageId: 1,
              reply: "다시 답변할게요",
              intent: null,
              suggestions: [],
              products: [],
            },
          },
          { status: 201 },
        );
      }),
    );

    setup();
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));
    const input = screen.getByPlaceholderText("궁금한 내용을 입력해주세요.");
    fireEvent.change(input, { target: { value: "안녕" } });
    fireEvent.click(screen.getByRole("button", { name: "전송" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() =>
      expect(screen.getByText("다시 답변할게요")).toBeInTheDocument(),
    );
    // 재시도는 봇 응답만 다시 요청한다 — 이미 떠 있던 사용자 버블을 중복 추가하지 않는다.
    expect(screen.getAllByText("안녕")).toHaveLength(1);
  });
});
