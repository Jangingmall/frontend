import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MypageRecentPage from "./page";

describe("MypageRecentPage", () => {
  it("준비 중 안내를 보여준다", () => {
    render(<MypageRecentPage />);

    expect(
      screen.getByText("최근 본 상품 조회 기능은 준비 중입니다"),
    ).toBeInTheDocument();
  });
});
