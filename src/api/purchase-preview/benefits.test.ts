import { expect, it } from "vitest";

import { applyPreviewBenefits } from "./benefits";
it("MSW calculates capped discounts without a real payment request", async () => {
  expect(
    await applyPreviewBenefits({
      subtotal: 10000,
      code: "MIDAM10",
      points: 3000,
      coupon: "welcome",
    }),
  ).toEqual({ discount: 6000, total: 4000 });
  expect(
    await applyPreviewBenefits({
      subtotal: 1000,
      points: 3000,
      coupon: "welcome",
    }),
  ).toEqual({ discount: 1000, total: 0 });
  await expect(
    applyPreviewBenefits({ subtotal: 10000, points: 4000 }),
  ).rejects.toThrow();
  await expect(
    applyPreviewBenefits({ subtotal: 10000, code: "wrong" }),
  ).rejects.toThrow();
});
