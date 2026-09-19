import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { getCartOptions } from "@/app/cart/_lib/cart-fixtures";

import { CartOptionDialog } from "./CartOptionDialog";
it("missing option submission focuses first control and does not save", async () => {
  const user = userEvent.setup();
  const apply = vi.fn();
  render(
    <CartOptionDialog
      open
      definitions={getCartOptions(1)}
      initialValues={[]}
      onOpenChange={vi.fn()}
      onApply={apply}
    />,
  );
  await user.click(screen.getByRole("button", { name: "변경하기" }));
  expect(screen.getByText("옵션을 선택하지 않았습니다")).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "필수 옵션 1" })).toHaveFocus();
  expect(apply).not.toHaveBeenCalled();
});
it("draft selection opens next option and cancel does not apply", async () => {
  const user = userEvent.setup();
  const apply = vi.fn();
  const close = vi.fn();
  render(
    <CartOptionDialog
      open
      definitions={getCartOptions(1)}
      initialValues={[]}
      onOpenChange={close}
      onApply={apply}
    />,
  );
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "필수 옵션 1" })).toHaveFocus(),
  );
  await user.keyboard("{ArrowDown}");
  await user.click(screen.getByRole("option", { name: "백자토" }));
  await waitFor(() =>
    expect(
      screen.getByRole("combobox", { name: "필수 옵션 2" }),
    ).toHaveAttribute("aria-expanded", "true"),
  );
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "취소" }));
  expect(close).toHaveBeenCalledWith(false);
  expect(apply).not.toHaveBeenCalled();
});
it("complete valid reselection saves immediately but incompatible predecessor keeps dialog", async () => {
  const user = userEvent.setup();
  const apply = vi.fn();
  render(
    <CartOptionDialog
      open
      definitions={getCartOptions(1)}
      initialValues={["백자토", "중", "무광", "선택 안 함"]}
      onOpenChange={vi.fn()}
      onApply={apply}
    />,
  );
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "필수 옵션 1" })).toHaveFocus(),
  );
  await user.keyboard("{ArrowDown}");
  await user.click(screen.getByRole("option", { name: "청자토" }));
  expect(apply).not.toHaveBeenCalled();
  expect(screen.getByText("선택 (1/4)")).toBeInTheDocument();
});
it("완료된 유효 옵션을 재선택하면 즉시 적용하고 닫는다", async () => {
  const user = userEvent.setup();
  const apply = vi.fn();
  const close = vi.fn();
  render(
    <CartOptionDialog
      open
      definitions={getCartOptions(1)}
      initialValues={["백자토", "중", "무광", "선택 안 함"]}
      onOpenChange={close}
      onApply={apply}
    />,
  );
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "필수 옵션 1" })).toHaveFocus(),
  );
  await user.tab();
  await user.tab();
  await user.keyboard("{ArrowDown}");
  await user.click(screen.getByRole("option", { name: "유광" }));
  expect(apply).toHaveBeenCalledWith(["백자토", "중", "유광", "선택 안 함"]);
  expect(close).toHaveBeenCalledWith(false);
});
