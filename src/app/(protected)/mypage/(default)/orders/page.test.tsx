import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MypageOrdersPage from "./page";

describe("MypageOrdersPage", () => {
  it("준비 중 안내를 보여준다", () => {
    render(<MypageOrdersPage />);

    expect(
      screen.getByText("주문 및 배송 조회 기능은 준비 중입니다"),
    ).toBeInTheDocument();
  });
});
