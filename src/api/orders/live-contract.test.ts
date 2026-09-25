import { http } from "msw";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { publicEnv } from "@/lib/env";
import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import {
  changeOrderAddress,
  confirmPurchase,
  fetchOrdersList,
  requestOrderCancel,
} from "./api";
import { orderFixtures } from "./mock/fixtures";

beforeEach(() => Object.assign(publicEnv, { apiMocking: false }));
afterEach(() => Object.assign(publicEnv, { apiMocking: true }));

it("결제 대기 주문 취소는 실제 경로를 사용하며 미지원 사유·사진을 보내지 않는다", async () => {
  const called = vi.fn();
  server.use(
    http.post("*/api/payments/orders/71/cancel", async ({ request }) => {
      called(await request.text());
      return mockOk({ orderId: 71, status: "CANCELED" });
    }),
  );
  await requestOrderCancel(71, { reason: "단순 변심", imageIds: [] });
  expect(called).toHaveBeenCalledWith("");
});
it("취소 응답이 다른 주문이면 성공 처리하지 않는다", async () => {
  server.use(
    http.post("*/api/payments/orders/71/cancel", () =>
      mockOk({ orderId: 72, status: "CANCELED" }),
    ),
  );
  await expect(
    requestOrderCancel(71, { reason: "단순 변심", imageIds: [] }),
  ).rejects.toThrow();
});
it("구매 확정은 최신 API를 호출하고 반환된 상태를 검증한다", async () => {
  const called = vi.fn();
  server.use(
    http.post("*/api/payments/orders/71/purchase-confirmation", () => {
      called();
      return mockOk({ orderId: 71, status: "PURCHASE_CONFIRMED" });
    }),
  );
  await confirmPurchase(71);
  expect(called).toHaveBeenCalledOnce();
});
it("이미 변경된 주문의 구매 확정 실패를 전달한다", async () => {
  server.use(
    http.post("*/api/payments/orders/71/purchase-confirmation", () =>
      mockError(422, "BUSINESS_RULE_VIOLATION"),
    ),
  );
  await expect(confirmPurchase(71)).rejects.toMatchObject({ status: 422 });
});
const address = {
  recipientName: "홍길동",
  phone: "01012345678",
  zipCode: "12345",
  address1: "서울시",
  address2: "101호",
};
it("기존 주소를 재사용해 주문 배송지 변경에 addressId만 보낸다", async () => {
  const create = vi.fn();
  const update = vi.fn();
  server.use(
    http.get("*/api/member/me/addresses", () =>
      mockOk([{ ...address, addressId: 9, isDefault: false }]),
    ),
    http.post("*/api/member/me/addresses", () => {
      create();
      return mockOk(null);
    }),
    http.patch(
      "*/api/payments/orders/71/shipping-address",
      async ({ request }) => {
        update(await request.json());
        return mockOk({ ...address, orderId: 71, addressId: 9 });
      },
    ),
  );
  await changeOrderAddress(71, address);
  expect(create).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledWith({ addressId: 9 });
});
it("구매 확정 필터와 응답 상태를 배송 완료와 구별한다", async () => {
  server.use(
    http.get("*/api/member/me/orders", ({ request }) => {
      expect(new URL(request.url).searchParams.get("status")).toBe(
        "PURCHASE_CONFIRMED",
      );
      return mockOk({
        content: [{ ...orderFixtures[0], status: "PURCHASE_CONFIRMED" }],
        number: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
        empty: false,
      });
    }),
  );
  const result = await fetchOrdersList({ status: "PURCHASE_CONFIRMED" });
  expect(result.items[0].items[0].status).toBe("PURCHASE_CONFIRMED");
});

it("최신 주문 thumbnail ImageRef와 null 레거시 이미지를 표시한다", async () => {
  server.use(
    http.get("*/api/member/me/orders", () =>
      mockOk({
        content: [
          {
            ...orderFixtures[0],
            items: [
              {
                ...orderFixtures[0].items[0],
                thumbnail: {
                  imageId: "img",
                  variants: [
                    {
                      url: "https://cdn.test/320.webp",
                      width: 320,
                      height: 320,
                      format: "webp",
                    },
                  ],
                },
              },
              {
                ...orderFixtures[0].items[0],
                orderItemId: 72,
                thumbnail: null,
                legacyThumbnailUrl: "https://cdn.test/legacy.webp",
              },
            ],
          },
        ],
        number: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
        empty: false,
      }),
    ),
  );
  const result = await fetchOrdersList();
  expect(result.items[0].items.map((i) => i.thumbnailUrl)).toEqual([
    "https://cdn.test/320.webp",
    "https://cdn.test/legacy.webp",
  ]);
});

it("새 주소 저장 후 변경 실패를 알리고 재시도 시 저장한 주소를 재사용한다", async () => {
  let saved = false;
  let attempts = 0;
  const create = vi.fn();
  server.use(
    http.get("*/api/member/me/addresses", () =>
      mockOk(saved ? [{ ...address, addressId: 9, isDefault: false }] : []),
    ),
    http.post("*/api/member/me/addresses", async ({ request }) => {
      create(await request.json());
      saved = true;
      return mockOk({ ...address, addressId: 9, isDefault: false });
    }),
    http.patch("*/api/payments/orders/71/shipping-address", (): Response => {
      attempts++;
      return attempts === 1
        ? mockError(503, "INTERNAL_ERROR")
        : mockOk({ ...address, orderId: 71, addressId: 9 });
    }),
  );
  await expect(changeOrderAddress(71, address)).rejects.toMatchObject({
    status: 503,
  });
  await changeOrderAddress(71, address);
  expect(create).toHaveBeenCalledExactlyOnceWith({
    ...address,
    isDefault: false,
  });
});
