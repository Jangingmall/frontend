import { describe, expect, it } from "vitest";

import { editNode, parseDocument, patchesBetween } from "./document";
const fixture = {
  schemaVersion: "2.0",
  canvasWidth: 774,
  root: [
    {
      id: "heading",
      type: "element",
      tag: "h2",
      props: { style: { color: "#333" } },
      children: [{ id: "text", type: "text", value: "원본", marks: [] }],
    },
    {
      id: "photo",
      type: "element",
      tag: "img",
      props: { imageId: "old" },
      children: [],
    },
  ],
};
describe("서버 문서 계약", () => {
  it("최상위 h2와 원본 노드 ID를 보존한다", () => {
    expect(parseDocument(fixture).root[0]?.id).toBe("heading");
  });
  it("텍스트 수정은 leaf ID로 전송하며 원본을 변경하지 않는다", () => {
    const original = parseDocument(fixture);
    const next = editNode(original, "text", { text: "수정" });
    expect(patchesBetween(original, next)).toEqual([
      { nodeId: "text", text: "수정" },
    ]);
    expect(JSON.stringify(original)).toContain("원본");
  });
  it("이미지는 imageId 교체만 PATCH한다", () => {
    const original = parseDocument(fixture);
    expect(
      patchesBetween(original, editNode(original, "photo", { imageId: "new" })),
    ).toEqual([{ nodeId: "photo", imageId: "new" }]);
  });
  it("중복 ID·스크립트·깊은 문서를 거부한다", () => {
    expect(() =>
      parseDocument({ ...fixture, root: [fixture.root[0], fixture.root[0]] }),
    ).toThrow();
    expect(() =>
      parseDocument({
        ...fixture,
        root: [{ id: "x", type: "element", tag: "script", children: [] }],
      }),
    ).toThrow();
    let node: unknown = { id: "leaf", type: "text", value: "x" };
    for (let i = 0; i < 40; i++)
      node = { id: String(i), type: "element", tag: "div", children: [node] };
    expect(() => parseDocument({ ...fixture, root: [node] })).toThrow();
  });
  it("위험한 속성과 URL은 렌더링 데이터에서 제거한다", () => {
    const doc = parseDocument({
      ...fixture,
      root: [
        {
          id: "x",
          type: "element",
          tag: "img",
          props: {
            src: "javascript:alert(1)",
            onerror: "alert(1)",
            style: { backgroundImage: "url(https://tracker.test)" },
          },
        },
      ],
    });
    expect(JSON.stringify(doc)).not.toMatch(
      /javascript|onerror|backgroundImage/,
    );
  });
});
import { imageReferences } from "./document";
it("이미지 URL에서 ID가 일치할 때만 연결한다", () => {
  expect(
    imageReferences(["https://cdn.test/content/1/old/1280w.webp"], ["new"]),
  ).toEqual({});
  expect(
    imageReferences(["https://cdn.test/content/1/old/1280w.webp"], ["old"]),
  ).toEqual({ old: "https://cdn.test/content/1/old/1280w.webp" });
});
