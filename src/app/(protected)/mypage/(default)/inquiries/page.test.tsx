import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MypageInquiriesPage from "./page";

describe("MypageInquiriesPage", () => {
  it("준비 중 안내를 보여준다", () => {
    render(<MypageInquiriesPage />);

    expect(
      screen.getByText("문의 내역 조회 기능은 준비 중입니다"),
    ).toBeInTheDocument();
  });
});
