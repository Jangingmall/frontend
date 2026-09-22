import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    let attempt = 0;
    server.use(
      http.post("*/api/chatbot/sessions/:sessionId/messages", () => {
        attempt += 1;
        if (attempt === 1) return mockError(500, "INTERNAL_ERROR");
        return HttpResponse.json(
          {
            success: true,
            status: 201,
            data: {
              sessionId: "session-1",
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
      http.post("*/api/chatbot/sessions", () =>
        HttpResponse.json(
          {
            success: true,
            status: 201,
            data: { sessionId: "session-1", expiresInSeconds: 3600 },
          },
          { status: 201 },
        ),
      ),
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
  });
});
