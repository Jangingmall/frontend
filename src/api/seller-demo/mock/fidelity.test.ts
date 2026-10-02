import { describe, expect, it } from "vitest";

import { flattenDocument, parseDocument } from "@/utils/seller-studio/document";

import first from "./fixtures/1.json";
import second from "./fixtures/2.json";
describe("section PNG content fidelity", () => {
  it.each([first, second])(
    "preserves five gallery photos and the making section number",
    (raw) => {
      const doc = parseDocument(raw);
      const gallery = doc.root.find((n) => n.id.includes("gallery-root"))!;
      expect(
        flattenDocument({ ...doc, root: [gallery] }).filter(
          (n) => n.tag === "img",
        ),
      ).toHaveLength(5);
      expect(flattenDocument(doc).some((n) => n.value === "02")).toBe(true);
    },
  );
  it("includes cup care bullets", () => {
    expect(JSON.stringify(first)).toContain(
      "잔 표면 전체에 연한 청록색 유약이 입혀져 부드러운 광택을 냅니다.",
    );
  });
  it("includes fan recommendation cards and palette labels", () => {
    const nodes = flattenDocument(parseDocument(second));
    for (const text of [
      "01",
      "03",
      "매화 문양",
      "대나무 뼈대",
      "한지 선면",
      "흰 한지",
      "검은 먹",
      "분홍 매화",
    ]) {
      expect(nodes.some((n) => n.value === text)).toBe(true);
    }
    const palette = nodes.find((n) => n.id.includes("palette-root"))!;
    expect(
      flattenDocument({
        schemaVersion: "2.0",
        canvasWidth: 774,
        root: [palette],
      }).find((n) => n.tag === "img")?.props?.imageId,
    ).toBe("packshot");
  });
});
