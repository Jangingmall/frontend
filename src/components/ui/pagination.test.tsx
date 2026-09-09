import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { getPageWindow, Pagination } from "./pagination";

describe("getPageWindow", () => {
  it("전체 페이지가 5 이하면 전부 노출한다", () => {
    expect(getPageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(getPageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("항상 5개, 현재 페이지를 가운데 둔다", () => {
    expect(getPageWindow(10, 20)).toEqual([8, 9, 10, 11, 12]);
  });

  it("시작 근처에서는 창을 왼쪽으로 붙인다", () => {
    expect(getPageWindow(2, 20)).toEqual([1, 2, 3, 4, 5]);
  });

  it("끝 근처에서는 창을 오른쪽으로 붙인다", () => {
    expect(getPageWindow(20, 20)).toEqual([16, 17, 18, 19, 20]);
  });
});

describe("Pagination", () => {
  it("번호 클릭 시 onPageChange 를 호출한다", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={5} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "3 페이지" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("현재 페이지에는 aria-current='page' 가 붙는다", () => {
    render(<Pagination page={2} pageCount={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "2 페이지" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("전체 페이지가 5 이하면 화살표 버튼이 없다", () => {
    render(<Pagination page={1} pageCount={5} onPageChange={vi.fn()} />);
    expect(
      screen.queryByRole("button", { name: "첫 페이지" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "다음 페이지" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("전체 페이지가 5 초과면 첫/이전/다음/끝 화살표가 나온다", () => {
    render(<Pagination page={10} pageCount={20} onPageChange={vi.fn()} />);
    for (const name of [
      "첫 페이지",
      "이전 페이지",
      "다음 페이지",
      "끝 페이지",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("첫 페이지에서 첫/이전 화살표가 비활성화된다", () => {
    render(<Pagination page={1} pageCount={20} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "첫 페이지" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "이전 페이지" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeEnabled();
  });

  it("마지막 페이지에서 다음/끝 화살표가 비활성화된다", () => {
    render(<Pagination page={20} pageCount={20} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "끝 페이지" })).toBeDisabled();
  });

  it("끝 화살표는 마지막 페이지로 이동시킨다", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageCount={20} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: "끝 페이지" }));
    expect(onPageChange).toHaveBeenCalledWith(20);
  });
});
