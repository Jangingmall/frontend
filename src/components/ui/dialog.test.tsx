import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { Dialog } from "./dialog";
import { Select, SelectItem } from "./select";

function DialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>열기</button>
      <Dialog open={open} onOpenChange={setOpen} title="문의 작성">
        <Select
          ariaLabel="문의 유형"
          items={[{ value: "delivery", label: "배송 문의" }]}
        >
          <SelectItem value="delivery">배송 문의</SelectItem>
        </Select>
        <button>등록</button>
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("제목을 제공하고 닫힌 뒤 외부 트리거로 포커스를 돌려준다", async () => {
    const user = userEvent.setup();
    render(<DialogExample />);
    const trigger = screen.getByRole("button", { name: "열기" });
    await user.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "문의 작성" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it("모달 안 Select를 조작하고 닫기 버튼으로 모달을 닫는다", async () => {
    const user = userEvent.setup();
    render(<DialogExample />);
    await user.click(screen.getByRole("button", { name: "열기" }));
    // 모달의 다음 프레임 초기 포커스가 Select 클릭과 겹치지 않게 기다린다.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "닫기" })).toHaveFocus(),
    );
    await user.click(screen.getByRole("combobox", { name: "문의 유형" }));
    // Select 팝업이 열리는 트랜지션이 끝나기 전엔 옵션이 `hidden`이라 접근성 트리에서
    // 안 잡힌다 — 즉시 조회하는 getByRole 대신 findByRole로 트랜지션 종료를 기다린다.
    await user.click(await screen.findByRole("option", { name: "배송 문의" }));
    expect(
      screen.getByRole("combobox", { name: "문의 유형" }),
    ).toHaveTextContent("배송 문의");
    await user.click(screen.getByRole("button", { name: "닫기" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("배경을 누르면 닫고 열린 동안 포커스는 모달 안에 유지한다", async () => {
    const user = userEvent.setup();
    render(<DialogExample />);
    await user.click(screen.getByRole("button", { name: "열기" }));
    const dialog = screen.getByRole("dialog");
    for (let index = 0; index < 5; index += 1) {
      await user.tab();
      await waitFor(() =>
        expect(dialog).toContainElement(document.activeElement as HTMLElement),
      );
    }
    const backdrop = document.querySelector<HTMLElement>(
      '[data-slot="dialog-backdrop"]',
    );
    expect(backdrop).not.toBeNull();
    await user.click(backdrop!);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
