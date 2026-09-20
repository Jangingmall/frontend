import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OrderDelivery } from "@/types/order";

import { DeliveryTrackingModal } from "./DeliveryTrackingModal";

const delivery: OrderDelivery = {
  orderId: 1,
  carrier: "CJ대한통운",
  trackingNumber: "600000000001",
  status: "IN_TRANSIT",
};

describe("DeliveryTrackingModal", () => {
  it("데이터가 있으면 택배사·운송장번호·상태를 보여준다", () => {
    render(
      <DeliveryTrackingModal
        open
        onOpenChange={() => {}}
        data={delivery}
        isPending={false}
        hasError={false}
        onRetry={() => {}}
      />,
    );
    expect(screen.getByText("CJ대한통운")).toBeInTheDocument();
    expect(screen.getByText("600000000001")).toBeInTheDocument();
    expect(screen.getByText("배송 중")).toBeInTheDocument();
  });

  it("로딩 중이면 데이터를 보여주지 않는다", () => {
    render(
      <DeliveryTrackingModal
        open
        onOpenChange={() => {}}
        isPending
        hasError={false}
        onRetry={() => {}}
      />,
    );
    expect(screen.queryByText("CJ대한통운")).not.toBeInTheDocument();
  });

  it("에러 상태면 재시도 버튼을 보여주고 클릭 시 onRetry를 호출한다", () => {
    const onRetry = vi.fn();
    render(
      <DeliveryTrackingModal
        open
        onOpenChange={() => {}}
        isPending={false}
        hasError
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("복사 버튼 클릭 시 운송장번호를 클립보드에 복사한다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <DeliveryTrackingModal
        open
        onOpenChange={() => {}}
        data={delivery}
        isPending={false}
        hasError={false}
        onRetry={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "복사" }));
    expect(writeText).toHaveBeenCalledWith("600000000001");
    expect(await screen.findByText("복사됨")).toBeInTheDocument();
  });
});
