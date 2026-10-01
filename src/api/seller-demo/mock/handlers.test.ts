import { getResponse } from "msw";
import { describe, expect, it } from "vitest";

import { isDemoFeatureRequest } from "@/lib/data-mode";

import { createSellerDemoHandlers } from "./handlers";

describe("seller demo uses the production API contract", () => {
  const handlers = createSellerDemoHandlers();
  const request = async (
    id: string,
    path: string,
    method = "GET",
    body?: unknown,
    session = "one",
  ) =>
    (await getResponse(
      handlers,
      new Request("http://localhost/api/mock/seller-demos/" + id + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Studio-Session": session,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    ))!;
  it.each(["1", "2"])(
    "runs product, generation, edit and publication in scenario %s",
    async (id) => {
      const product = (
        await (
          await request(id, "/api/products", "POST", {
            title: "시연 작품",
            price: 10000,
            stock: 3,
          })
        ).json()
      ).data;
      expect(product.productId).toBeGreaterThan(0);
      const base = "/api/content/products/" + product.productId;
      const gen = (
        await (
          await request(id, base + "/generations", "POST", {
            productName: "시연 작품",
            howMade: "제작",
            careTips: "관리",
            images: ["photo"],
          })
        ).json()
      ).data;
      await request(id, base + "/generations/" + gen.generationId);
      expect(
        (
          await (
            await request(id, base + "/generations/" + gen.generationId)
          ).json()
        ).data.status,
      ).toBe("COMPLETED");
      const content = (await (await request(id, base + "/contents")).json())
        .data;
      expect(content.reactDocument.root).toHaveLength(id === "1" ? 8 : 9);
      const first =
        content.reactDocument.root[0].children[0].children[0].children[0];
      expect(
        (
          await request(id, base + "/contents/" + content.contentId, "PATCH", {
            patches: [{ nodeId: first.id, text: "바꾼 문구" }],
          })
        ).status,
      ).toBe(200);
      expect(
        JSON.stringify(
          (await (await request(id, base + "/contents")).json()).data,
        ),
      ).toContain("바꾼 문구");
      expect(
        (await request(id, base + "/contents", "GET", undefined, "another"))
          .status,
      ).toBe(404);
      expect((await request(id, base + "/publish", "POST")).status).toBe(422);
      await request(
        id,
        base + "/contents/" + content.contentId + "/submit",
        "POST",
      );
      expect(
        (
          await request(
            id,
            base + "/contents/" + content.contentId + "/approve",
            "POST",
            {},
          )
        ).status,
      ).toBe(400);
      await request(
        id,
        base + "/contents/" + content.contentId + "/approve",
        "POST",
        { factCheckConfirmed: true, photoMatchConfirmed: true },
      );
      expect(
        (await (await request(id, base + "/publish", "POST")).json()).data
          .status,
      ).toBe("PUBLISHED");
      expect(
        (await (await request(id, "/api/products/" + product.productId)).json())
          .data.price,
      ).toBe(10000);
    },
  );
  it("only allows dedicated demo contracts", () => {
    expect(
      isDemoFeatureRequest("/api/mock/seller-demos/1/api/products", "POST"),
    ).toBe(true);
    expect(isDemoFeatureRequest("/api/products", "POST")).toBe(false);
    expect(
      isDemoFeatureRequest("/api/mock/seller-demos/3/api/products", "POST"),
    ).toBe(false);
  });
});
