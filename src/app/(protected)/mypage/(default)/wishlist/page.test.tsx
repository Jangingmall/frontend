import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MypageWishlistPage from "./page";

describe("MypageWishlistPage", () => {
  it("준비 중 안내를 보여준다", () => {
    render(<MypageWishlistPage />);

    expect(
      screen.getByText("찜 목록 조회 기능은 준비 중입니다"),
    ).toBeInTheDocument();
  });
});
