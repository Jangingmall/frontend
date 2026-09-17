import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MypageSidebar } from "./MypageSidebar";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname }));

describe("MypageSidebar", () => {
  it("8개 항목을 전부 실제 링크로 렌더한다", () => {
    usePathname.mockReturnValue("/mypage/account");
    render(<MypageSidebar />);

    for (const [label, href] of [
      ["주문 및 배송", "/mypage/orders"],
      ["취소 · 교환 · 환불", "/mypage/orders/cancellations"],
      ["내가 쓴 후기", "/mypage/reviews"],
      ["찜 목록", "/mypage/wishlist"],
      ["최근 본 상품", "/mypage/recent"],
      ["상품 문의", "/mypage/inquiries"],
      ["회원 정보 수정", "/mypage/account"],
      ["설정", "/mypage/settings"],
    ] as const) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  it("현재 경로와 일치하는 항목만 active 표시(aria-current)된다", () => {
    usePathname.mockReturnValue("/mypage/account");
    render(<MypageSidebar />);

    expect(
      screen.getByRole("link", { name: "회원 정보 수정" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "상품 문의" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
