import { expect, it } from "vitest";

import { fetchPreviewCart, savePreviewCart, submitPreviewOrder } from "./api";
it("구매 시연은 MSW 저장·조회·결과 응답을 거친다", async () => {
  expect(await savePreviewCart([])).toEqual([]);
  expect(await fetchPreviewCart()).toEqual([]);
  await expect(submitPreviewOrder([], "success")).rejects.toThrow();
});
