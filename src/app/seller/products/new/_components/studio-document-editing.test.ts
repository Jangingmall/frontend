import type { CSSProperties } from "react";
import { describe, expect, it } from "vitest";

import firstFixture from "@/api/seller-demo/mock/fixtures/1.json";
import secondFixture from "@/api/seller-demo/mock/fixtures/2.json";
import {
  type DocumentNode,
  flattenDocument,
  parseDocument,
  type StudioDocument,
} from "@/utils/seller-studio/document";

import {
  addSection,
  addText,
  deleteNode,
  duplicateSection,
  findNode,
  moveSection,
  PAGE_LAYOUTS,
  replaceImage,
  sectionTitle,
  setSectionBackground,
  styleText,
  supportedPatches,
  TEXT_STYLES,
  updateText,
} from "./studio-document-editing";

function documentFixture(): StudioDocument {
  return parseDocument({
    schemaVersion: "2.0",
    canvasWidth: 774,
    root: [
      {
        id: "first",
        type: "element",
        tag: "section",
        props: { style: { backgroundColor: "#e4d8ca", padding: 24 } },
        children: [
          {
            id: "heading",
            type: "element",
            tag: "h2",
            props: { style: { fontSize: 22, color: "#222" } },
            children: [{ id: "title", type: "text", value: "작품 제목" }],
          },
          {
            id: "paragraph",
            type: "element",
            tag: "p",
            props: { style: { color: "#333", lineHeight: 1.5 } },
            children: [
              { id: "body-a", type: "text", value: "첫 번째 문장" },
              { id: "line-break", type: "element", tag: "br" },
              { id: "body-b", type: "text", value: "두 번째 문장" },
            ],
          },
          {
            id: "photo",
            type: "element",
            tag: "img",
            props: {
              imageId: "original-image",
              src: "https://cdn.test/original.webp",
              alt: "원본 작품",
              style: { width: "100%" },
            },
          },
        ],
      },
      { id: "second", type: "element", tag: "section", children: [] },
    ],
  });
}

function subtree(node: DocumentNode): DocumentNode[] {
  return flattenDocument({
    schemaVersion: "2.0",
    canvasWidth: 774,
    root: [node],
  });
}

function parentOf(document: StudioDocument, id: string) {
  return flattenDocument(document).find((node) =>
    node.children?.some((child) => child.id === id),
  );
}

function withoutIds(node: DocumentNode): unknown {
  const { id: _id, children, ...rest } = node;
  void _id;
  return {
    ...rest,
    ...(children ? { children: children.map(withoutIds) } : {}),
  };
}

describe("원본 JSON 문서 편집", () => {
  it("중첩 노드를 찾고 제목 및 빈 페이지 이름을 반환한다", () => {
    const document = documentFixture();
    expect(findNode(document, "body-b")?.value).toBe("두 번째 문장");
    expect(findNode(document, "missing")).toBeUndefined();
    expect(sectionTitle(document.root[0])).toBe("작품 제목");
    expect(sectionTitle(document.root[1])).toBe("빈 페이지");
  });

  it("제목 태그 없는 원본 페이지는 번호나 eyebrow 대신 가장 큰 주제목을 표시한다", () => {
    const document = parseDocument(secondFixture);
    const snapshot = JSON.stringify(document);
    expect(sectionTitle(document.root[1])).toBe(
      "3년 건조한 대나무, 손으로 깎은 선면",
    );
    expect(sectionTitle(document.root[6])).toBe("전주 부채 시리즈");
    expect(JSON.stringify(document)).toBe(snapshot);
  });

  it("가장 큰 텍스트 그룹의 여러 leaf를 공백으로 연결하고 빈 그룹은 건너뛴다", () => {
    const document = documentFixture();
    const section = document.root[0];
    section.children = [
      {
        id: "empty-heading",
        type: "element",
        tag: "div",
        props: { style: { fontSize: 40 } },
        children: [{ id: "empty", type: "text", value: "  " }],
      },
      {
        id: "eyebrow",
        type: "element",
        tag: "p",
        props: { style: { fontSize: 10 } },
        children: [{ id: "label", type: "text", value: "제작 이야기" }],
      },
      {
        id: "main-title",
        type: "element",
        tag: "div",
        props: { style: { fontSize: "28px" } },
        children: [
          { id: "title-a", type: "text", value: "  손으로 빚은\n" },
          {
            id: "title-strong",
            type: "element",
            tag: "strong",
            children: [
              { id: "title-b", type: "text", value: "하나뿐인 작품  " },
            ],
          },
        ],
      },
      {
        id: "body",
        type: "element",
        tag: "p",
        props: { style: { fontSize: 16 } },
        children: [{ id: "body-text", type: "text", value: "본문 설명" }],
      },
    ];
    const snapshot = JSON.stringify(document);
    expect(sectionTitle(section)).toBe("손으로 빚은 하나뿐인 작품");
    expect(JSON.stringify(document)).toBe(snapshot);
  });

  it("명시적 제목 태그는 더 큰 본문보다 우선하며 제목 안의 문구를 함께 표시한다", () => {
    const document = documentFixture();
    const heading = findNode(document, "heading")!;
    heading.children!.push({ id: "title-end", type: "text", value: "이야기" });
    const paragraph = findNode(document, "paragraph")!;
    paragraph.props!.style!.fontSize = 48;
    expect(sectionTitle(document.root[0])).toBe("작품 제목 이야기");
  });
  it("두 fixture의 총 17개 페이지, 표, 갤러리, 원본 ID를 보존하면서 한 문구만 수정한다", () => {
    const originals = [firstFixture, secondFixture].map(parseDocument);
    expect(originals[0].root.length + originals[1].root.length).toBe(17);
    for (const original of originals) {
      const snapshot = JSON.stringify(original);
      const text = flattenDocument(original).find(
        (node) => node.type === "text",
      )!;
      const edited = updateText(original, text.id, "수정한 문구");
      expect(findNode(edited, text.id)?.value).toBe("수정한 문구");
      expect(edited.root).toHaveLength(original.root.length);
      expect(
        flattenDocument(edited).map((node) => [node.id, node.tag]),
      ).toEqual(flattenDocument(original).map((node) => [node.id, node.tag]));
      expect(updateText(edited, text.id, text.value!)).toEqual(original);
      expect(JSON.stringify(original)).toBe(snapshot);
    }
    expect(
      flattenDocument(originals[0]).some((node) => node.tag === "table"),
    ).toBe(true);
    expect(originals[0].root.some((node) => node.id.includes("gallery"))).toBe(
      true,
    );
  });

  it("텍스트 서식은 그 부모의 기존 속성을 유지하며 바꾼다", () => {
    const original = documentFixture();
    const edited = styleText(original, "title", {
      fontSize: 28,
      lineHeight: 1.3,
      fontWeight: 600,
      textAlign: "center",
    });
    expect(findNode(edited, "heading")?.props?.style).toEqual({
      color: "#222",
      fontSize: 28,
      lineHeight: 1.3,
      fontWeight: 600,
      textAlign: "center",
    });
    expect(findNode(edited, "title")).toEqual(findNode(original, "title"));
    expect(findNode(edited, "paragraph")).toEqual(
      findNode(original, "paragraph"),
    );
    expect(findNode(original, "heading")?.props?.style?.fontSize).toBe(22);
  });

  it("같은 부모에 있는 이웃 문구의 서식과 줄바꿈을 변경하지 않는다", () => {
    const original = documentFixture();
    const edited = styleText(original, "body-a", {
      color: "#b00",
      fontWeight: 700,
    });
    expect(parentOf(edited, "body-a")?.props?.style).toMatchObject({
      color: "#b00",
      fontWeight: 700,
    });
    expect(findNode(edited, "paragraph")?.props).toEqual(
      findNode(original, "paragraph")?.props,
    );
    expect(findNode(edited, "body-b")).toEqual(findNode(original, "body-b"));
    expect(parentOf(edited, "body-b")?.id).toBe("paragraph");
    expect(findNode(edited, "line-break")).toEqual(
      findNode(original, "line-break"),
    );
    expect(() => parseDocument(edited)).not.toThrow();
  });

  it("분리된 문구에 나중에 정렬을 바꿔도 블록 너비 안에서 반영한다", () => {
    const colored = styleText(documentFixture(), "body-a", { color: "#b00" });
    const aligned = styleText(colored, "body-a", { textAlign: "right" });
    expect(parentOf(aligned, "body-a")?.props?.style).toMatchObject({
      color: "#b00",
      textAlign: "right",
      display: "block",
    });
    expect(parentOf(aligned, "body-b")?.props?.style).toEqual({
      color: "#333",
      lineHeight: 1.5,
    });
  });
  it("외부 CSS 실행 값과 허용되지 않은 속성은 서식에 넣지 않는다", () => {
    const edited = styleText(documentFixture(), "title", {
      color: "red; background: url(https://tracker.test)",
      backgroundImage: "url(https://tracker.test)",
      fontSize: 17,
    } as CSSProperties);
    expect(findNode(edited, "heading")?.props?.style).toEqual({
      color: "#222",
      fontSize: 17,
    });
  });

  it.each([
    ["headline", 28, 1.3, 600],
    ["title", 22, 1.2, 600],
    ["subtitle", 17, 1.3, 600],
    ["body", 16, 1.4, 400],
    ["small", 13, 1.4, 400],
    ["caption", 10, 1.4, 400],
  ])(
    "%s 텍스트를 선택한 페이지에 추가한다",
    (styleId, fontSize, lineHeight, fontWeight) => {
      const original = documentFixture();
      const added = addText(original, "second", String(styleId));
      expect(findNode(added.document, added.nodeId)?.type).toBe("text");
      expect(
        subtree(added.document.root[1]).some(
          (node) => node.id === added.nodeId,
        ),
      ).toBe(true);
      expect(
        parentOf(added.document, added.nodeId)?.props?.style,
      ).toMatchObject({ fontSize, lineHeight, fontWeight });
      expect(added.document.root[0]).toEqual(original.root[0]);
      expect(TEXT_STYLES).toHaveLength(6);
      expect(() => parseDocument(added.document)).not.toThrow();
    },
  );

  it("페이지 미선택 시 첫 페이지에 텍스트를 추가한다", () => {
    const added = addText(documentFixture(), undefined, "body");
    expect(
      subtree(added.document.root[0]).some((node) => node.id === added.nodeId),
    ).toBe(true);
    expect(added.document.root[1].children).toEqual([]);
  });

  it("텍스트와 사진 삭제는 다른 노드와 원본을 유지한다", () => {
    const original = documentFixture();
    const edited = deleteNode(deleteNode(original, "body-a"), "photo");
    expect(findNode(edited, "body-a")).toBeUndefined();
    expect(findNode(edited, "photo")).toBeUndefined();
    expect(findNode(edited, "body-b")?.value).toBe("두 번째 문장");
    expect(findNode(original, "photo")?.props?.imageId).toBe("original-image");
  });

  it("페이지 삭제 후에도 마지막 페이지는 유지한다", () => {
    const onePage = deleteNode(documentFixture(), "first");
    expect(onePage.root.map((node) => node.id)).toEqual(["second"]);
    expect(deleteNode(onePage, "second")).toEqual(onePage);
  });

  it.each(["#fff", "#fafbfc", "#121b29"])(
    "페이지 배경 %s만 변경한다",
    (color) => {
      const original = documentFixture();
      const edited = setSectionBackground(original, "first", color);
      expect(edited.root[0].props?.style).toEqual({
        backgroundColor: color,
        padding: 24,
      });
      expect(edited.root[0].children).toEqual(original.root[0].children);
      expect(original.root[0].props?.style?.backgroundColor).toBe("#e4d8ca");
    },
  );

  it.each([
    ["text", 0],
    ["text-image-right", 1],
    ["text-image-left", 1],
    ["image-1", 1],
    ["image-2", 2],
    ["image-3", 3],
  ])(
    "%s 페이지를 선택 페이지 뒤에 빈 내용으로 추가한다",
    (layoutId, imageCount) => {
      const original = documentFixture();
      const added = addSection(original, "first", String(layoutId));
      expect(added.document.root.map((node) => node.id)).toEqual([
        "first",
        added.sectionId,
        "second",
      ]);
      const section = findNode(added.document, added.sectionId)!;
      const nodes = subtree(section);
      expect(section.tag).toBe("section");
      expect(section.props?.style).toMatchObject({
        paddingTop: 120,
        paddingBottom: 120,
      });
      expect(nodes.filter((node) => node.tag === "img")).toHaveLength(
        Number(imageCount),
      );
      expect(
        nodes
          .filter((node) => node.type === "text")
          .every((node) => node.value === ""),
      ).toBe(true);
      expect(
        nodes
          .filter((node) => node.tag === "img")
          .every((node) => !node.props?.src && !node.props?.imageId),
      ).toBe(true);
      expect(
        nodes.every(
          (node) =>
            typeof node.props?.style?.width !== "number" ||
            node.props.style.width <= 774,
        ),
      ).toBe(true);
      expect(added.document.root[0]).toEqual(original.root[0]);
      expect(PAGE_LAYOUTS).toHaveLength(6);
      expect(() => parseDocument(added.document)).not.toThrow();
    },
  );

  it("선택 페이지가 없으면 끝에 추가하고 텍스트 레이아웃은 505px 중앙 폭을 쓴다", () => {
    const added = addSection(documentFixture(), undefined, "text");
    expect(added.document.root.at(-1)?.id).toBe(added.sectionId);
    const section = findNode(added.document, added.sectionId)!;
    expect(
      subtree(section).some(
        (node) =>
          node.props?.style?.width === 505 &&
          node.props.style.marginLeft === "auto" &&
          node.props.style.marginRight === "auto",
      ),
    ).toBe(true);
  });

  it("분할 페이지의 이미지 좌우 위치를 지킨다", () => {
    const left = addSection(documentFixture(), undefined, "text-image-left");
    const right = addSection(documentFixture(), undefined, "text-image-right");
    const leftNodes = subtree(findNode(left.document, left.sectionId)!);
    const rightNodes = subtree(findNode(right.document, right.sectionId)!);
    expect(leftNodes.findIndex((node) => node.tag === "img")).toBeLessThan(
      leftNodes.findIndex((node) => node.type === "text"),
    );
    expect(rightNodes.findIndex((node) => node.tag === "img")).toBeGreaterThan(
      rightNodes.findIndex((node) => node.type === "text"),
    );
  });

  it("페이지 복제는 모든 후손 ID를 새로 만들고 내용과 속성을 보존한다", () => {
    const original = documentFixture();
    original.root[0].id = "a".repeat(200);
    const snapshot = JSON.stringify(original);
    const result = duplicateSection(original, original.root[0].id);
    const copy = result.document.root[1];
    const oldIds = new Set(flattenDocument(original).map((node) => node.id));
    const newIds = subtree(copy).map((node) => node.id);
    expect(copy.id).toBe(result.sectionId);
    expect(newIds.every((id) => !oldIds.has(id) && id.length <= 200)).toBe(
      true,
    );
    expect(new Set(newIds).size).toBe(newIds.length);
    expect(withoutIds(copy)).toEqual(withoutIds(original.root[0]));
    expect(JSON.stringify(original)).toBe(snapshot);
    expect(() => parseDocument(result.document)).not.toThrow();
  });

  it("페이지 순서를 옮기고 범위를 벗어난 위치는 처음이나 끝으로 제한한다", () => {
    const original = documentFixture();
    const moved = moveSection(original, "first", 999);
    expect(moved.root.map((node) => node.id)).toEqual(["second", "first"]);
    expect(moveSection(moved, "first", -3)).toEqual(original);
    expect(original.root.map((node) => node.id)).toEqual(["first", "second"]);
  });

  it("이미지 ID를 교체할 때 원본 src를 제거하고 alt와 크기를 유지한다", () => {
    const original = documentFixture();
    const edited = replaceImage(original, "photo", "replacement");
    expect(findNode(edited, "photo")?.props).toEqual({
      imageId: "replacement",
      alt: "원본 작품",
      style: { width: "100%" },
    });
    expect(findNode(original, "photo")?.props?.src).toBe(
      "https://cdn.test/original.webp",
    );
  });

  it("서버 PATCH는 구조·서식 편집을 제외하고 기존 ID의 텍스트와 imageId만 포함한다", () => {
    const original = documentFixture();
    let edited = addSection(original, "first", "image-2").document;
    const added = addText(edited, "first", "body");
    edited = updateText(added.document, added.nodeId, "새 문구");
    edited = styleText(edited, "title", { fontWeight: 700 });
    edited = updateText(edited, "title", "바꾼 제목");
    edited = deleteNode(edited, "body-a");
    edited = replaceImage(edited, "photo", "replacement");
    edited = moveSection(edited, "first", 2);
    expect(supportedPatches(original, edited)).toEqual([
      { nodeId: "title", text: "바꾼 제목" },
      { nodeId: "photo", imageId: "replacement" },
    ]);
    expect(
      supportedPatches(original, duplicateSection(original, "first").document),
    ).toEqual([]);
  });

  it("없는 대상이나 잘못된 종류의 편집은 문서를 변경하지 않는다", () => {
    const original = documentFixture();
    expect(updateText(original, "photo", "잘못된 대상")).toEqual(original);
    expect(styleText(original, "missing", { color: "red" })).toEqual(original);
    expect(deleteNode(original, "missing")).toEqual(original);
    expect(moveSection(original, "missing", 0)).toEqual(original);
    expect(setSectionBackground(original, "heading", "#fff")).toEqual(original);
    expect(replaceImage(original, "title", "replacement")).toEqual(original);
  });
});
