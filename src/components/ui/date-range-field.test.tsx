import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { DateRangeField } from "./date-range-field";

/**
 * `selected`가 controlled prop이라 실제 화면처럼 `onChange`가 상태를 갱신해야 두 번째 클릭이
 * "범위 이어서 고르기"로 동작한다 — 정적 mock만 넘기면 매번 "새 시작점"으로 취급된다
 * (`react-day-picker`의 `addToRange` 로직).
 */
function Controlled({
  onChange,
}: {
  onChange: (range: { from: string; to: string }) => void;
}) {
  const [range, setRange] = useState({ from: "2026-01-05", to: "2026-01-05" });
  return (
    <DateRangeField
      from={range.from}
      to={range.to}
      onChange={(next) => {
        setRange(next);
        onChange(next);
      }}
    />
  );
}

describe("DateRangeField", () => {
  it("트리거에 시작일을 포맷해서 보여준다", () => {
    render(
      <DateRangeField from="2026-01-05" to="2026-01-05" onChange={vi.fn()} />,
    );
    expect(screen.getByText("2026.01.05")).toBeInTheDocument();
  });

  it("트리거를 클릭하면 달력 팝업이 열린다", async () => {
    const user = userEvent.setup();
    render(
      <DateRangeField from="2026-01-05" to="2026-01-05" onChange={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: "2026.01.05" }));
    expect(
      await screen.findByText("10", { selector: "button" }),
    ).toBeInTheDocument();
  });

  it("두 날짜를 순서대로 고르면 범위로 onChange를 호출하고 팝업을 닫는다", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Controlled onChange={handleChange} />);
    await user.click(screen.getByRole("button", { name: "2026.01.05" }));
    await user.click(await screen.findByText("10", { selector: "button" }));
    await user.click(await screen.findByText("20", { selector: "button" }));
    expect(handleChange).toHaveBeenLastCalledWith({
      from: "2026-01-10",
      to: "2026-01-20",
    });
  });
});
