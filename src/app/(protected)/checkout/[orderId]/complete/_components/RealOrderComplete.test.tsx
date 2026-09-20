import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { RealOrderComplete } from "./RealOrderComplete";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
const state = vi.hoisted(() => ({ status: "CREATED", fetching: false }));
vi.mock("@/queries/payments", () => ({
  usePaymentOrderQuery: () => ({
    isPending: false,
    isFetching: state.fetching,
    isError: false,
    data: {
      orderId: 42,
      orderNumber: "ORD-12345",
      totalAmount: 5000,
      status: state.status,
    },
  }),
}));
it("does not announce completion for unpaid persisted orders", () => {
  state.status = "CREATED";
  render(<RealOrderComplete orderId={42} />);
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
    "결제 완료가 확인되지 않았습니다",
  );
});
it("announces completion only for confirmed persisted paid state", () => {
  state.status = "PAID";
  render(<RealOrderComplete orderId={42} />);
  expect(
    screen.getByRole("heading", { name: "주문이 완료되었습니다" }),
  ).toBeVisible();
  expect(screen.getByText("주문번호: ORD-12345")).toBeVisible();
});
it("waits for current status instead of displaying a cached paid result", () => {
  state.status = "PAID";
  state.fetching = true;
  render(<RealOrderComplete orderId={42} />);
  expect(
    screen.queryByRole("heading", { name: "주문이 완료되었습니다" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toBeVisible();
  state.fetching = false;
});
