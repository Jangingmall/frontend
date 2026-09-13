import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeroBanner } from "./HeroBanner";

describe("HeroBanner", () => {
  it("공예품 둘러보기는 상품 목록으로 이동한다", () => {
    render(<HeroBanner />);
    expect(
      screen.getByRole("link", { name: "공예품 둘러보기" }),
    ).toHaveAttribute("href", "/products");
  });

  it("장인관 둘러보기는 실제 이동 없이 비활성 상태다", () => {
    render(<HeroBanner />);
    expect(
      screen.queryByRole("link", { name: "장인관 둘러보기" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("장인관 둘러보기")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
