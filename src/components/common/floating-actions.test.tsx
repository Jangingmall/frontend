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

  it("AI CHAT은 아직 기능이 없어 비활성 상태로 보여준다", () => {
    render(<FloatingActions />);
    expect(
      screen.queryByRole("button", { name: /AI CHAT/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("AI CHAT").closest("[aria-disabled]"),
    ).toHaveAttribute("aria-disabled", "true");
  });
});
