import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MypageSidebar } from "./MypageSidebar";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname }));

describe("MypageSidebar", () => {
  it("8개 항목을 전부 렌더한다", () => {
    usePathname.mockReturnValue("/mypage/account");
    render(<MypageSidebar />);

    for (const label of [
      "주문 및 배송",
      "취소 · 교환 · 환불",
      "내가 쓴 후기",
      "찜 목록",
      "최근 본 상품",
      "상품 문의",
      "회원 정보 수정",
      "설정",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("라우트가 아직 없는 항목은 링크가 아니라 aria-disabled span이다", () => {
    usePathname.mockReturnValue("/mypage/account");
    render(<MypageSidebar />);

    const disabled = screen.getByText("주문 및 배송");
    expect(disabled.tagName).toBe("SPAN");
    expect(disabled).toHaveAttribute("aria-disabled", "true");
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

  it("회원 정보 수정·상품 문의는 실제 링크로 렌더된다", () => {
    usePathname.mockReturnValue("/mypage/inquiries");
    render(<MypageSidebar />);

    expect(
      screen.getByRole("link", { name: "회원 정보 수정" }),
    ).toHaveAttribute("href", "/mypage/account");
    expect(screen.getByRole("link", { name: "상품 문의" })).toHaveAttribute(
      "href",
      "/mypage/inquiries",
    );
  });
});
