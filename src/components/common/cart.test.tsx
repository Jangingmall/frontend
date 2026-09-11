import { render, screen } from "@testing-library/react";
import type { Route } from "next";
import { describe, expect, it } from "vitest";

import { Cart } from "./cart";

describe("Cart", () => {
  it("href가 없으면 button으로 렌더한다", () => {
    render(<Cart />);

    expect(
      screen.getByRole("button", { name: "장바구니" }),
    ).toBeInTheDocument();
  });

  it("href가 있으면 그 경로로 가는 link로 렌더한다", () => {
    render(<Cart href={"/cart" as Route} />);

    expect(screen.getByRole("link", { name: "장바구니" })).toHaveAttribute(
      "href",
      "/cart",
    );
  });

  it("count가 0이면 뱃지를 숨긴다", () => {
    render(<Cart count={0} />);

    expect(
      screen.getByRole("button", { name: "장바구니" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("count가 있으면 뱃지에 개수를 보여준다", () => {
    render(<Cart count={3} />);

    expect(
      screen.getByRole("button", { name: "장바구니 (3개)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("count가 100 이상이면 99+로 캡한다", () => {
    render(<Cart count={128} />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});
