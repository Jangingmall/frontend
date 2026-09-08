import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Pagination, getPaginationRange } from "./pagination";

describe("getPaginationRange", () => {
  it("페이지 수가 적으면 전부 노출한다", () => {
    expect(getPaginationRange(1, 5, 1, 1)).toEqual([1, 2, 3, 4, 5]);
  });

  it("중간에서는 양끝 + 현재 주변만 남기고 생략한다", () => {
    expect(getPaginationRange(10, 20, 1, 1)).toEqual([
      1,
      "ellipsis",
      9,
      10,
      11,
      "ellipsis",
      20,
    ]);
  });

  it("시작 근처에서는 앞쪽 생략 없이 초반 번호를 보여준다", () => {
    expect(getPaginationRange(2, 20, 1, 1)).toEqual([
      1,
      2,
      3,
      4,
      5,
      "ellipsis",
      20,
    ]);
  });

  it("간격이 1칸이면 생략 대신 번호를 노출한다", () => {
    expect(getPaginationRange(4, 7, 1, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
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

  it("첫 페이지에서 이전 버튼이 비활성화된다", () => {
    render(<Pagination page={1} pageCount={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "이전 페이지" })).toBeDisabled();
  });

  it("마지막 페이지에서 다음 버튼이 비활성화된다", () => {
    render(<Pagination page={5} pageCount={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeDisabled();
  });
});
