import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { getProductDetailMock } from "@/api/products/mock/detail-fixtures";

import { ProductInformation } from "./ProductInformation";

it("실제 API 안내가 비어 있어도 공통 안내를 펼쳐 확인한다", async () => {
  const user = userEvent.setup();
  const product = getProductDetailMock(101)!;
  render(
    <ProductInformation
      product={{
        ...product,
        isMock: false,
        notices: [],
        shippingInformation: [],
      }}
    />,
  );
  const shipping = screen.getByRole("button", {
    name: "배송정보",
  });
  expect(shipping).toHaveAttribute("aria-expanded", "false");
  await user.click(shipping);
  expect(screen.getByText("배송 방법")).toBeVisible();
  expect(
    screen.getByText(/장인이 개별 계약한 택배사를 통해 직접 발송/),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "결제정보" }));
  expect(screen.getByText(/실시간 계좌이체/)).toBeVisible();
  expect(shipping).toHaveAttribute("aria-expanded", "true");
  await user.click(screen.getByRole("button", { name: "교환 및 반품정보" }));
  expect(screen.getByText("제한 조건")).toBeVisible();
  expect(screen.getByText(/상품을 공급받은 날부터 7일 이내/)).toBeVisible();
});

it("상품별 안내를 공통 안내로 덮어쓰지 않는다", async () => {
  const user = userEvent.setup();
  const product = getProductDetailMock(101)!;
  render(
    <ProductInformation
      product={{
        ...product,
        notices: [{ label: "작품 관리", content: "작품 전용 관리 안내" }],
      }}
    />,
  );
  await user.click(screen.getByRole("button", { name: "작품 관리" }));
  expect(screen.getByText("작품 전용 관리 안내")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "제품 유의사항" }),
  ).not.toBeInTheDocument();
});

it("MSW 상세 응답에서도 구조화된 배송 안내를 보존한다", () => {
  const product = getProductDetailMock(101)!;
  expect(product.shippingInformation[0].details).toEqual([
    {
      label: "지원 결제수단",
      content: "실시간 계좌이체\n무통장입금\n신용·체크카드\n토스페이",
    },
  ]);
});
