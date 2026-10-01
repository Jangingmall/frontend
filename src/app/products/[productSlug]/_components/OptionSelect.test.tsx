import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { OptionSelect, type OptionSelectItem } from "./OptionSelect";

const ITEMS: OptionSelectItem[] = [
  { value: "white", label: "백색" },
  { value: "sold", label: "품절 색상", disabled: true },
  { value: "blue", label: "청색" },
];

function Harness({
  onValueChange = vi.fn(),
  initialOpen = false,
  disabled,
}: {
  onValueChange?: (value: string) => void;
  initialOpen?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [value, setValue] = useState<string | null>(null);
  return (
    <div>
      <OptionSelect
        ariaLabel="색상 (필수)"
        placeholder="1. 색상 (필수)"
        items={ITEMS}
        value={value}
        open={open}
        onOpenChange={setOpen}
        onValueChange={(next) => {
          setValue(next);
          setOpen(false);
          onValueChange(next);
        }}
        disabled={disabled}
      />
      <p>다음 옵션</p>
    </div>
  );
}

describe("OptionSelect", () => {
  it("목록을 트리거 바로 아래에 인라인으로 펼쳐 다음 요소 앞에 놓는다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("combobox", { name: "색상 (필수)" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(trigger);

    const listbox = screen.getByRole("listbox", { name: "색상 (필수)" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", listbox.id);
    // Portal 팝업이 아니라 같은 흐름에 있어, 다음 요소가 목록 뒤로 밀린다.
    expect(
      listbox.compareDocumentPosition(screen.getByText("다음 옵션")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("항목을 누르면 선택하고 닫으며 선택한 라벨을 보여준다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "청색" }));

    expect(onValueChange).toHaveBeenCalledWith("blue");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("청색");
  });

  it("비활성 항목은 선택되지 않는다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} initialOpen />);
    const sold = screen.getByRole("option", { name: "품절 색상" });
    expect(sold).toHaveAttribute("aria-disabled", "true");
    await user.click(sold);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("키보드로 열고 비활성 항목을 건너뛰며 Enter로 선택한다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    const trigger = screen.getByRole("combobox");
    trigger.focus();

    await user.keyboard("{ArrowDown}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "백색" }).id,
    );

    await user.keyboard("{ArrowDown}");
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "청색" }).id,
    );

    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("blue");
    expect(trigger).toHaveFocus();
  });

  it("Home·End로 처음과 끝 항목으로 이동하고 Esc로 닫는다", async () => {
    const user = userEvent.setup();
    render(<Harness initialOpen />);
    const trigger = screen.getByRole("combobox");
    trigger.focus();

    await user.keyboard("{End}");
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "청색" }).id,
    );
    await user.keyboard("{Home}");
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "백색" }).id,
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("바깥을 누르면 닫는다", async () => {
    const user = userEvent.setup();
    render(<Harness initialOpen />);
    await user.click(screen.getByText("다음 옵션"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("부모가 열면 키보드 흐름이 이어지도록 트리거로 포커스를 옮긴다", () => {
    render(<Harness initialOpen />);
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("disabled면 열리지 않는다", async () => {
    const user = userEvent.setup();
    render(<Harness disabled />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
