import { http } from "msw";
import { expect, it, vi } from "vitest";

import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { fetchProductMaterials } from "./client";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
it("실제 소재는 소분류 ID를 보내고 문자열 배열을 화면 모델로 변환한다", async () => {
  server.use(
    http.get("*/api/products/materials", ({ request }) => {
      expect(new URL(request.url).searchParams.get("subcategoryId")).toBe("12");
      return mockOk(["나무", "금속"]);
    }),
  );
  expect(await fetchProductMaterials("subcategory-12")).toEqual([
    { id: "나무", name: "나무" },
    { id: "금속", name: "금속" },
  ]);
});
