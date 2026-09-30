import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FloatingActions } from "./floating-actions";

describe("FloatingActions", () => {
  it("TOP을 클릭하면 페이지 맨 위로 스크롤한다", () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;
    render(<FloatingActions />);
    fireEvent.click(screen.getByRole("button", { name: "맨 위로" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("onAiChatToggle이 없으면 미담 챗봇 버튼은 비인터랙티브 상태로 보여준다", () => {
    render(<FloatingActions />);
    expect(
      screen.queryByRole("button", { name: /미담 챗봇/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("미담 챗봇").closest("[aria-disabled]"),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("onAiChatToggle이 있으면 미담 챗봇 버튼이 클릭 가능하다", () => {
    const onAiChatToggle = vi.fn();
    render(<FloatingActions onAiChatToggle={onAiChatToggle} />);
    fireEvent.click(screen.getByRole("button", { name: "미담 챗봇" }));
    expect(onAiChatToggle).toHaveBeenCalledOnce();
  });

  it("isChatOpen이면 접기 버튼 하나만 보여준다", () => {
    const onAiChatToggle = vi.fn();
    render(<FloatingActions isChatOpen onAiChatToggle={onAiChatToggle} />);
    expect(
      screen.queryByRole("button", { name: "맨 위로" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "미담 챗봇" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "챗봇 패널 접기" }));
    expect(onAiChatToggle).toHaveBeenCalledOnce();
  });

  it("상품 상세에서는 TOP만 표시하고 동작을 유지한다", () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;
    render(<FloatingActions showAiChat={false} />);
    expect(screen.queryByText("미담 챗봇")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "맨 위로" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("하단 위치는 모바일 32px · md 이상 48px(뷰포트 고정)이다", () => {
    const { container } = render(<FloatingActions />);
    const root = container.firstElementChild;
    expect(root).toHaveClass("fixed", "bottom-8", "md:bottom-12", "right-0");
  });

  it("패널이 열리면 패널 옆(right-120)에 붙고, 패널이 전폭인 모바일에서는 숨긴다", () => {
    const { container } = render(
      <FloatingActions isChatOpen onAiChatToggle={vi.fn()} />,
    );
    expect(container.firstElementChild).toHaveClass(
      "right-120",
      "max-md:hidden",
    );
  });
});
