import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MypageReviewsPage from "./page";

describe("MypageReviewsPage", () => {
  it("준비 중 안내를 보여준다", () => {
    render(<MypageReviewsPage />);

    expect(
      screen.getByText("내가 쓴 후기 조회 기능은 준비 중입니다"),
    ).toBeInTheDocument();
  });
});
