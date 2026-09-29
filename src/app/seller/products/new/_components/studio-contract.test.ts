import { describe, expect, it } from "vitest";

import {
  buildPreview,
  draftSchema,
  editSection,
  parseContract,
} from "./studio-contract";
import { exampleAssets, exampleDraft } from "./studio-fixture";

describe("공식 상세페이지 계약을 사용하는 제작 화면", () => {
  it("root 배열과 element/text 구조를 만든다", () => {
    const doc = parseContract(buildPreview(exampleDraft), exampleAssets);
    expect(doc.schemaVersion).toBe("2.0");
    expect(doc.root[0].type).toBe("element");
    expect(doc.root[0].tag).toBe("section");
  });
  it("hero 편집은 저장 draft와 미리보기 문구를 동기화한다", () => {
    const draft = editSection(exampleDraft, "hero", {
      title: "새로운 작품 이야기",
    });
    expect(draft.hero_headline).toBe("새로운 작품 이야기");
    expect(JSON.stringify(buildPreview(draft))).toContain("새로운 작품 이야기");
    expect(exampleDraft.hero_headline).not.toBe("새로운 작품 이야기");
  });
  it("중복 ID와 잘못된 자산 참조를 차단한다", () => {
    const doc = buildPreview(exampleDraft);
    doc.root[1].id = doc.root[0].id;
    expect(() => parseContract(doc, exampleAssets)).toThrow();
    expect(() => parseContract(buildPreview(exampleDraft), [])).toThrow();
  });
  it("이벤트와 미지원 스타일을 차단한다", () => {
    const doc = buildPreview(exampleDraft);
    expect(() =>
      parseContract({ ...doc, onClick: "alert(1)" }, exampleAssets),
    ).toThrow();
    doc.root[0].props = { style: { position: "fixed" } } as never;
    expect(() => parseContract(doc, exampleAssets)).toThrow();
  });
});

it("시연 글 서식을 문서에 반영하고 저장 후 유지한다", () => {
  const changed = editSection(
    exampleDraft,
    exampleDraft.page_plan[0].section_id,
    {
      textStyle: { align: "left", bold: true, color: "#414954", size: "body" },
    },
  );
  const restored = draftSchema.parse(JSON.parse(JSON.stringify(changed)));
  const document = buildPreview(restored);
  const copy = document.root[0];
  expect(JSON.stringify(copy)).toContain('"textAlign":"left"');
  expect(JSON.stringify(copy)).toContain('"fontWeight":700');
});

it("정렬만 수정하면 어두운 배경의 글자색과 굵기를 유지한다", () => {
  const changed = editSection(
    exampleDraft,
    exampleDraft.page_plan[0].section_id,
    {
      variant: "ink",
      textStyle: { align: "left" },
    },
  );
  const restored = draftSchema.parse(JSON.parse(JSON.stringify(changed)));
  const document = parseContract(buildPreview(restored), exampleAssets);
  const root = document.root[0];
  const copy = root.children?.find((node) => node.id.endsWith("-copy"));
  expect(copy?.type).toBe("element");
  if (copy?.type !== "element") throw new Error("copy missing");
  expect(copy.props?.style?.textAlign).toBe("left");
  expect(JSON.stringify(copy)).not.toContain('"color"');
  expect(JSON.stringify(copy)).not.toContain('"fontWeight"');
  expect(JSON.stringify(copy)).not.toContain('"fontSize"');
});
