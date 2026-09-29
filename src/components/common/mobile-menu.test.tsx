import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { gnbCategoriesFixture } from "@/api/products/mock/gnb-categories";

import { MobileMenu, type MobileMenuProps } from "./mobile-menu";

function setup(overrides: Partial<MobileMenuProps> = {}) {
  const props: MobileMenuProps = {
    open: true,
    onOpenChange: vi.fn(),
    view: "root",
    onViewChange: vi.fn(),
    categories: gnbCategoriesFixture,
    ...overrides,
  };
  render(<MobileMenu {...props} />);
  return props;
}

describe("MobileMenu — 전체 메뉴(HO-menu-1)", () => {
  it("닫혀 있으면 아무것도 렌더하지 않는다", () => {
    setup({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("전체 메뉴 7개 항목을 시안 순서로 보여준다", () => {
    setup();
    const nav = screen.getByRole("navigation", { name: "전체 메뉴" });
    expect(
      [...nav.querySelectorAll("button, a, span")].map((el) => el.textContent),
    ).toEqual([
      "전체 카테고리",
      "전체 상품",
      "선물관",
      "장인관",
      "신상품",
      "베스트",
      "기획전",
    ]);
  });

  it("선물관·장인관·기획전은 링크가 아니라 비활성 항목이다", () => {
    setup();
    for (const label of ["선물관", "장인관", "기획전"]) {
      const item = screen.getByText(label);
      expect(item.tagName).toBe("SPAN");
      expect(item).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("닫기 버튼을 누르면 닫힌다", async () => {
    const { onOpenChange } = setup();
    await userEvent.click(screen.getByRole("button", { name: "메뉴 닫기" }));
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("ESC로 닫힌다", async () => {
    const { onOpenChange } = setup();
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("이동 링크를 누르면 메뉴를 닫는다", async () => {
    const { onOpenChange } = setup();
    await userEvent.click(screen.getByRole("link", { name: "신상품" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("전체 카테고리를 누르면 대분류 화면으로 바꿔 달라고 알린다", async () => {
    const { onViewChange } = setup();
    await userEvent.click(
      screen.getByRole("button", { name: "전체 카테고리" }),
    );
    expect(onViewChange).toHaveBeenCalledWith("category");
  });

  describe("최상단 로그인 줄", () => {
    it("비로그인이면 로그인 / 회원가입 → /login", () => {
      setup({ authStatus: "anonymous" });
      expect(
        screen.getByRole("link", { name: "로그인 / 회원가입" }),
      ).toHaveAttribute("href", "/login");
    });

    it("로그인 상태면 사용자 이름(→ /mypage)과 로그아웃 버튼을 보여준다", async () => {
      const { onOpenChange } = setup({
        authStatus: "authenticated",
        userName: "김미담",
        onLogout: vi.fn(),
      });
      const name = screen.getByRole("link", { name: "김미담" });
      expect(name).toHaveAttribute("href", "/mypage");
      expect(
        screen.queryByRole("link", { name: "로그인 / 회원가입" }),
      ).not.toBeInTheDocument();
      await userEvent.click(name);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("로그아웃 버튼을 누르면 onLogout을 부른다", async () => {
      const { onLogout } = setup({
        authStatus: "authenticated",
        userName: "김미담",
        onLogout: vi.fn(),
      });
      await userEvent.click(screen.getByRole("button", { name: "로그아웃" }));
      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it("비로그인이면 로그아웃 버튼이 없다", () => {
      setup({ authStatus: "anonymous" });
      expect(
        screen.queryByRole("button", { name: "로그아웃" }),
      ).not.toBeInTheDocument();
    });

    it("확인 중이면 링크 없이 스켈레톤만 보여준다", () => {
      render(
        <MobileMenu
          open
          onOpenChange={vi.fn()}
          view="root"
          onViewChange={vi.fn()}
          authStatus="loading"
        />,
      );
      expect(
        screen.queryByRole("link", { name: "로그인 / 회원가입" }),
      ).not.toBeInTheDocument();
      expect(
        document.querySelector('[data-slot="skeleton"]'),
      ).toBeInTheDocument();
    });
  });
});

describe("MobileMenu — 대분류 → 소분류(HO-menu-2)", () => {
  it("뒤로가기를 누르면 전체 메뉴로 돌아가 달라고 알린다", async () => {
    const { onViewChange } = setup({ view: "category" });
    await userEvent.click(screen.getByRole("button", { name: "뒤로가기" }));
    expect(onViewChange).toHaveBeenCalledWith("root");
  });

  it("대분류 7개를 PL-2로 가는 링크로 보여준다(펼치지 않는다)", () => {
    setup({ view: "category" });
    const nav = screen.getByRole("navigation", { name: "분류" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(7);
    expect(links[0]).toHaveAttribute("href", "/products?category=category-1");
    expect(links[0]).toHaveTextContent("키친 · 다이닝");
    expect(links[6]).toHaveAttribute("href", "/products?category=category-7");
    expect(screen.queryByRole("link", { name: "다기 · 찻잔" })).toBeNull();
    expect(within(nav).queryByRole("button", { expanded: false })).toBeNull();
  });

  it("대분류를 누르면 메뉴를 닫는다", async () => {
    const { onOpenChange } = setup({ view: "category" });
    await userEvent.click(screen.getByRole("link", { name: /키친 · 다이닝/ }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("분류가 없고 조회 중이면 로딩 상태를 보여준다", () => {
    setup({ view: "category", categories: [], categoriesStatus: "loading" });
    expect(
      screen.getByRole("status", { name: "분류를 불러오는 중" }),
    ).toBeInTheDocument();
  });

  it("분류가 없고 오류면 안내와 다시 시도를 보여주고 재시도를 알린다", async () => {
    const onCategoriesRetry = vi.fn();
    setup({
      view: "category",
      categories: [],
      categoriesStatus: "error",
      onCategoriesRetry,
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "분류를 불러오지 못했습니다",
    );
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onCategoriesRetry).toHaveBeenCalledTimes(1);
  });
});
