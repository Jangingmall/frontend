import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrderDetailBackLink } from "./OrderDetailBackLink";

describe("OrderDetailBackLink", () => {
  it("주문 목록으로 돌아가는 링크를 렌더링한다", () => {
    render(<OrderDetailBackLink />);
    const link = screen.getByRole("link", { name: /주문 상세보기/ });
    expect(link).toHaveAttribute("href", "/mypage/orders");
  });
});
