import { http } from "msw";
import { expect, it } from "vitest";

import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { requestOrderExchangeRefund } from "./api";
it("반품 응답이 다른 주문을 가리키면 성공 처리하지 않는다", async () => {
  server.use(
    http.post("*/api/payments/returns", () =>
      mockOk(
        {
          returnId: 1,
          orderId: 999,
          type: "RETURN",
          status: "REQUESTED",
          requestedAt: "2026-09-28T00:00:00Z",
        },
        201,
      ),
    ),
  );
  await expect(
    requestOrderExchangeRefund(1, {
      type: "RETURN",
      orderItemId: 1,
      reason: "CHANGE_OF_MIND",
      imageIds: [],
    }),
  ).rejects.toThrow();
});
