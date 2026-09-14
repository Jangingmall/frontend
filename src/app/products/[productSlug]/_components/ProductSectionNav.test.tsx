import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";

import { ProductSectionNav } from "./ProductSectionNav";

afterEach(() => window.history.replaceState(null, "", "/"));

it("리뷰 해시로 직접 진입하면 리뷰 메뉴를 활성화한다", () => {
  window.history.replaceState(null, "", "/#product-reviews");
  render(<ProductSectionNav />);
  expect(screen.getByRole("link", { name: "리뷰·문의" })).toHaveAttribute(
    "aria-current",
    "location",
  );
  expect(screen.getByRole("link", { name: "상품정보" })).not.toHaveAttribute(
    "aria-current",
  );
});

it("브라우저 해시 변경과 빈·잘못된 해시를 메뉴에 반영한다", () => {
  render(<ProductSectionNav />);
  for (const [hash, label] of [
    ["#product-shipping", "배송안내"],
    ["#product-notices", "유의사항"],
    ["#unknown", "상품정보"],
    ["#product-reviews", "리뷰·문의"],
    ["", "상품정보"],
  ]) {
    act(() => {
      window.history.replaceState(null, "", `/${hash}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "aria-current",
      "location",
    );
  }
});

it("메뉴 클릭으로 해시와 활성 표시를 함께 변경한다", async () => {
  const user = userEvent.setup();
  render(<ProductSectionNav />);
  const link = screen.getByRole("link", { name: "리뷰·문의" });
  await user.click(link);
  expect(window.location.hash).toBe("#product-reviews");
  expect(link).toHaveAttribute("aria-current", "location");
});
