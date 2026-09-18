import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { cartFixtures } from "@/app/cart/_lib/cart-fixtures";

import { CartPage } from "./CartPage";
beforeEach(() => vi.clearAllMocks());
it("selection and quantity update amount, sold out cannot be selected", async () => {
  const user = userEvent.setup();
  render(<CartPage initialLines={cartFixtures.mixed} />);
  expect(
    screen.getByRole("checkbox", { name: "백자 찻잔 선택" }),
  ).toHaveAttribute("aria-disabled", "true");
  await user.click(screen.getByRole("checkbox", { name: "전체 선택" }));
  expect(screen.getByRole("button", { name: "구매하기" })).toBeDisabled();
  await user.click(
    screen.getByRole("checkbox", { name: "김도윤 장인 상품 선택" }),
  );
  await user.click(screen.getAllByRole("button", { name: "증가" })[0]);
  expect(
    within(
      screen.getByRole("complementary", { name: "결제 정보" }),
    ).getAllByText("640,000원"),
  ).toHaveLength(2);
});
it("delete final item and undo restore empty-state transition", async () => {
  const user = userEvent.setup();
  render(<CartPage initialLines={[cartFixtures.base[0]]} />);
  await user.click(screen.getByRole("button", { name: "백자 달항아리 삭제" }));
  await user.click(screen.getByRole("button", { name: "삭제하기" }));
  expect(screen.getByText("장바구니가 비어있습니다.")).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "장바구니에 다시 추가" }),
  );
  expect(screen.getByText("백자 달항아리")).toBeInTheDocument();
});
it("anonymous purchase requests login and signed-in purchase gets a snapshot", async () => {
  const user = userEvent.setup();
  const onCheckout = vi.fn();
  const { rerender } = render(
    <CartPage initialLines={cartFixtures.base} onCheckout={onCheckout} />,
  );
  await user.click(screen.getByRole("button", { name: "2건 구매하기" }));
  expect(
    screen.getByText("로그인 페이지로 이동하시겠습니까?"),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "취소" }));
  rerender(
    <CartPage
      initialLines={cartFixtures.base}
      authenticated
      onCheckout={onCheckout}
    />,
  );
  await user.click(screen.getByRole("button", { name: "2건 구매하기" }));
  expect(onCheckout).toHaveBeenCalledWith(cartFixtures.base.slice(0, 2));
});
it("옵션 모달은 Escape로 닫히고 트리거로 포커스를 복귀한다", async () => {
  const user = userEvent.setup();
  render(<CartPage initialLines={cartFixtures.base} />);
  const trigger = screen.getAllByRole("button", { name: "옵션 변경" })[0];
  await user.click(trigger);
  await screen.findByRole("dialog", { name: "상품 옵션 변경" });
  await user.keyboard("{Escape}");
  await waitFor(() => expect(trigger).toHaveFocus());
});
