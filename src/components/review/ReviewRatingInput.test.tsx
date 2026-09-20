import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewRatingInput } from "./ReviewRatingInput";

describe("ReviewRatingInput", () => {
  it("미선택 상태를 aria-valuetext로 알린다", () => {
    render(<ReviewRatingInput value={0} onChange={vi.fn()} />);
    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-valuetext",
      "미선택",
    );
  });

  it("선택된 값을 aria-valuenow/aria-valuetext로 보여준다", () => {
    render(<ReviewRatingInput value={4.5} onChange={vi.fn()} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "4.5");
    expect(slider).toHaveAttribute("aria-valuetext", "5점 만점에 4.5점");
  });

  it("방향키로 0.5 단위 증감한다", () => {
    const onChange = vi.fn();
    render(<ReviewRatingInput value={2} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith(2.5);
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith(1.5);
  });

  it("Home/End로 최소·최대값으로 이동한다", () => {
    const onChange = vi.fn();
    render(<ReviewRatingInput value={2} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "Home" });
    expect(onChange).toHaveBeenCalledWith(0);
    fireEvent.keyDown(slider, { key: "End" });
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("별을 클릭하면 값을 선택한다", () => {
    const onChange = vi.fn();
    render(<ReviewRatingInput value={0} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("review-rating-star-0"));
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0]![0]).toBeGreaterThan(0);
  });

  it("에러 메시지를 보여준다", () => {
    render(
      <ReviewRatingInput
        value={0}
        onChange={vi.fn()}
        error="별점을 입력해주세요."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("별점을 입력해주세요.");
  });
});
