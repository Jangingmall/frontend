import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchPanel } from "./search-panel";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("SearchPanel", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("마운트되면 입력창에 자동으로 포커스된다", () => {
    render(<SearchPanel onClose={() => {}} />);

    expect(screen.getByPlaceholderText("검색어를 입력해주세요.")).toHaveFocus();
  });

  it("값이 없으면 지우기 버튼이 없고, 입력하면 나타난다", () => {
    render(<SearchPanel onClose={() => {}} />);
    const input = screen.getByPlaceholderText("검색어를 입력해주세요.");

    expect(
      screen.queryByRole("button", { name: "입력 지우기" }),
    ).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "다기" } });

    expect(
      screen.getByRole("button", { name: "입력 지우기" }),
    ).toBeInTheDocument();
  });

  it("지우기 버튼을 클릭하면 값이 비워지고 입력창에 포커스가 유지된다", () => {
    render(<SearchPanel onClose={() => {}} />);
    const input =
      screen.getByPlaceholderText<HTMLInputElement>("검색어를 입력해주세요.");

    fireEvent.change(input, { target: { value: "다기" } });
    fireEvent.click(screen.getByRole("button", { name: "입력 지우기" }));

    expect(input.value).toBe("");
    expect(input).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "입력 지우기" }),
    ).not.toBeInTheDocument();
  });

  it("Enter로 제출하면 검색 결과 페이지로 이동하고 onClose가 호출된다", () => {
    const onClose = vi.fn();
    render(<SearchPanel onClose={onClose} />);
    const input = screen.getByPlaceholderText("검색어를 입력해주세요.");

    fireEvent.change(input, { target: { value: "다기" } });
    fireEvent.submit(screen.getByRole("search"));

    expect(push).toHaveBeenCalledWith("/search?q=%EB%8B%A4%EA%B8%B0");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("검색 버튼 클릭도 같은 방식으로 제출된다", () => {
    const onClose = vi.fn();
    render(<SearchPanel onClose={onClose} />);
    const input = screen.getByPlaceholderText("검색어를 입력해주세요.");

    fireEvent.change(input, { target: { value: "다기" } });
    fireEvent.click(screen.getByRole("button", { name: "검색 실행" }));

    expect(push).toHaveBeenCalledWith("/search?q=%EB%8B%A4%EA%B8%B0");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("빈 값으로 제출하면 이동도 닫힘도 일어나지 않는다", () => {
    const onClose = vi.fn();
    render(<SearchPanel onClose={onClose} />);

    fireEvent.submit(screen.getByRole("search"));

    expect(push).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("공백만 있는 값으로 제출해도 이동도 닫힘도 일어나지 않는다", () => {
    const onClose = vi.fn();
    render(<SearchPanel onClose={onClose} />);
    const input = screen.getByPlaceholderText("검색어를 입력해주세요.");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(screen.getByRole("search"));

    expect(push).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("특수문자와 공백을 포함한 검색어를 정확히 인코딩한다", () => {
    render(<SearchPanel onClose={() => {}} />);
    const input = screen.getByPlaceholderText("검색어를 입력해주세요.");

    fireEvent.change(input, { target: { value: "다기 & 찻잔" } });
    fireEvent.submit(screen.getByRole("search"));

    expect(push).toHaveBeenCalledWith(
      `/search?q=${encodeURIComponent("다기 & 찻잔")}`,
    );
  });
});
