import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrderClaimProductSummary } from "./OrderClaimProductSummary";

describe("OrderClaimProductSummary", () => {
  it("상품명·구매일자·옵션을 보여준다", () => {
    render(
      <OrderClaimProductSummary
        item={{
          productName: "백자 달항아리",
          price: 320000,
          quantity: 1,
          thumbnailUrl: "https://cdn.midam.store/products/1.jpg",
          options: ["색상: 백자색", "사이즈: 중"],
        }}
        purchasedAt="2026-09-05T00:00:00.000Z"
      />,
    );
    expect(screen.getByText("백자 달항아리")).toBeInTheDocument();
    expect(screen.getByText("2026.09.05 구매")).toBeInTheDocument();
    expect(screen.getByText("색상: 백자색")).toBeInTheDocument();
    expect(screen.getByText("사이즈: 중")).toBeInTheDocument();
  });

  it("옵션이 없으면(목록에서 연 경우) 옵션 줄을 그리지 않는다", () => {
    render(
      <OrderClaimProductSummary
        item={{
          productName: "백자 달항아리",
          price: 320000,
          quantity: 1,
          thumbnailUrl: null,
        }}
        purchasedAt="2026-09-05T00:00:00.000Z"
      />,
    );
    expect(screen.getByText("백자 달항아리")).toBeInTheDocument();
    expect(screen.queryByText(/색상/)).not.toBeInTheDocument();
  });
});
