import { getResponse } from "msw";
import { describe, expect, it } from "vitest";

import { isDemoFeatureRequest } from "@/lib/data-mode";

import { createSellerDemoHandlers } from "./handlers";
describe("seller demo isolation", () => {
  const handlers = createSellerDemoHandlers();
  const request = async (
    id: string,
    method: string,
    body?: unknown,
    session = "one",
  ) => {
    const res = await getResponse(
      handlers,
      new Request("http://localhost/api/mock/seller-demos/" + id, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Studio-Session": session,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    );
    return res!;
  };
  it("returns each supplied document and resolves all image references", async () => {
    for (const [id, title] of [
      ["1", "청자 분청"],
      ["2", "매화"],
    ]) {
      const res = await request(id, "POST", {
        name: "시연",
        making: "제작",
        care: "관리",
        images: ["sample"],
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(JSON.stringify(json)).toContain(title);
      expect(JSON.stringify(json)).toContain("/seller-demos/" + id + "/");
    }
  });
  it("keeps saves separate by scenario and browser session", async () => {
    const initial = await (
      await request("1", "POST", {
        name: "시연",
        making: "제작",
        care: "관리",
        images: ["sample"],
      })
    ).json();
    const doc = initial.data.document;
    const saved = await request("1", "PUT", { document: doc });
    expect(saved.status).toBe(200);
    expect((await request("1", "GET", undefined, "other")).status).toBe(404);
    expect((await request("3", "POST", {})).status).toBe(404);
  });
  it("validates input and permits only the dedicated mock endpoints", async () => {
    expect((await request("1", "POST", {})).status).toBe(400);
    expect(isDemoFeatureRequest("/api/mock/seller-demos/1", "POST")).toBe(true);
    expect(
      isDemoFeatureRequest("/api/content/products/1/generations", "POST"),
    ).toBe(false);
    expect(isDemoFeatureRequest("/api/mock/seller-demos/3", "POST")).toBe(
      false,
    );
  });
});
