import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MypageOrderCancellationsPage from "./page";

describe("MypageOrderCancellationsPage", () => {
  it("준비 중 안내를 보여준다", () => {
    render(<MypageOrderCancellationsPage />);

    expect(
      screen.getByText("취소 · 교환 · 환불 조회 기능은 준비 중입니다"),
    ).toBeInTheDocument();
  });
});
