import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  inquiryHandlers,
  resetInquiryMock,
} from "@/api/inquiries/mock/handlers";
import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { ProductInquiries } from "./ProductInquiries";

describe("상품 문의 화면", () => {
  beforeEach(() => {
    server.use(...inquiryHandlers);
    resetInquiryMock();
    useAuthStore.getState().clear();
  });
  function mount(isMock = true) {
    const onRequireLogin = vi.fn();
    const onNotify = vi.fn();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <ProductInquiries
          productId={101}
          isMock={isMock}
          onNotify={onNotify}
          onRequireLogin={onRequireLogin}
        />
      </QueryClientProvider>,
    );
    return { onRequireLogin, onNotify };
  }
  function login() {
    useAuthStore.getState().setSession("mock-access-token", {
      id: 1,
      name: "김미담",
      role: "USER",
    });
  }
  it("실제 공개 문의는 유형 없이 1000자까지 등록하고 목록을 요청하지 않는다", async () => {
    login();
    const listRequest = vi.fn();
    server.use(
      http.get("*/api/products/101/questions", () => {
        listRequest();
        return mockOk({});
      }),
      http.post("*/api/products/101/questions", async ({ request }) => {
        expect(await request.json()).toEqual({
          content: "제작 기간 문의",
          secret: false,
        });
        return mockOk({
          questionId: 1,
          productId: 101,
          writerId: 1,
          content: "제작 기간 문의",
          secret: false,
          createdAt: "2026-09-17T10:00:00",
          answer: null,
        });
      }),
    );
    const { onNotify } = mount(false);
    await userEvent.click(screen.getByRole("button", { name: "문의하기" }));
    expect(
      screen.queryByRole("combobox", { name: "문의 유형" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "비밀글 설정" }),
    ).not.toBeInTheDocument();
    const body = screen.getByRole("textbox", { name: "내용 *" });
    expect(body).toHaveAttribute("maxlength", "1000");
    await userEvent.type(body, "제작 기간 문의");
    await userEvent.click(screen.getByRole("button", { name: "등록하기" }));
    await waitFor(() =>
      expect(onNotify).toHaveBeenCalledWith("문의가 등록되었습니다."),
    );
    expect(listRequest).not.toHaveBeenCalled();
  });
  it("비로그인 작성 요청은 로그인 안내로 연결한다", async () => {
    const { onRequireLogin } = mount();
    await userEvent.click(screen.getByRole("button", { name: "문의하기" }));
    expect(onRequireLogin).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("세션 복원 중에는 문의 작성을 막고 로그인 확인 후 활성화한다", async () => {
    useAuthStore.setState({ status: "loading" });
    const { onRequireLogin } = mount();
    const compose = screen.getByRole("button", { name: "문의하기" });
    expect(compose).toBeDisabled();
    fireEvent.click(compose);
    expect(onRequireLogin).not.toHaveBeenCalled();
    act(() => login());
    expect(compose).toBeEnabled();
    await userEvent.click(compose);
    expect(
      await screen.findByRole("dialog", { name: "상품 문의하기" }),
    ).toBeInTheDocument();
  });
  it("문의 유형이 빠지면 오류를 선택 상자에 연결하고 포커스한 뒤 선택 시 해제한다", async () => {
    login();
    mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "문의하기" }));
    await user.type(
      screen.getByRole("textbox", { name: "내용 *" }),
      "선물 포장이 가능한가요?",
    );
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    const type = screen.getByRole("combobox", { name: "문의 유형" });
    await screen.findByText("문의 유형을 선택해주세요.");
    expect(type).toHaveAttribute("aria-invalid", "true");
    expect(type).toHaveAccessibleDescription("문의 유형을 선택해주세요.");
    expect(type).toHaveFocus();

    await user.click(type);
    await user.click(await screen.findByRole("option", { name: "배송" }));
    await waitFor(() =>
      expect(type).not.toHaveAttribute("aria-invalid", "true"),
    );
    expect(type).not.toHaveAccessibleDescription("문의 유형을 선택해주세요.");
  });
  it("실패 후 입력을 보존하고 중복 제출을 막은 뒤 재시도 성공 시 개수를 갱신한다", async () => {
    login();
    let requests = 0;
    server.use(
      http.post("*/api/mock/products/101/inquiries", async () => {
        requests++;
        await delay(200);
        return mockError(503, "INTERNAL_ERROR");
      }),
    );
    const { onNotify } = mount();
    await screen.findByText("문의 (8)");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "문의하기" }));
    await user.click(screen.getByRole("combobox", { name: "문의 유형" }));
    await user.click(await screen.findByRole("option", { name: "기타" }));
    await user.type(
      screen.getByRole("textbox", { name: "문의 제목 *" }),
      "포장 문의",
    );
    await user.type(
      screen.getByRole("textbox", { name: "내용 *" }),
      "선물 포장이 가능한가요?",
    );
    await user.click(screen.getByRole("checkbox", { name: "비밀글 설정" }));
    const submit = screen.getByRole("button", { name: "등록하기" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    await screen.findByRole("alert");
    expect(requests).toBe(1);
    expect(screen.getByRole("textbox", { name: "문의 제목 *" })).toHaveValue(
      "포장 문의",
    );
    expect(screen.getByRole("textbox", { name: "내용 *" })).toHaveValue(
      "선물 포장이 가능한가요?",
    );
    server.use(...inquiryHandlers);
    await user.click(submit);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await screen.findByText("문의 (9)");
    expect(onNotify).toHaveBeenCalledWith("문의가 등록되었습니다.");
  });
  it("본인 비밀글을 본 뒤 로그아웃하면 본문을 제거하고 전체보기에서 필터를 적용한다", async () => {
    login();
    mount();
    await screen.findByText("문의 (8)");
    await userEvent.click(
      screen.getByRole("button", { name: /비공개 배송지/ }),
    );
    expect(
      await screen.findByText("비공개 배송지 문의입니다."),
    ).toBeInTheDocument();
    act(() => useAuthStore.getState().clear());
    await waitFor(() =>
      expect(
        screen.queryByText("비공개 배송지 문의입니다."),
      ).not.toBeInTheDocument(),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "문의 전체보기" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByText("비밀글입니다.")).toHaveLength(6);
    await userEvent.click(
      within(dialog).getByRole("checkbox", { name: "비밀글 제외" }),
    );
    expect(within(dialog).queryByText("비밀글입니다.")).not.toBeInTheDocument();
  });
});
