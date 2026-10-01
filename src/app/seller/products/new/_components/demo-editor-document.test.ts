import { describe, expect, it } from "vitest";

import { fixture } from "@/api/seller-demo/mock/document";

import {
  createDemoDraft,
  demoSnapshotSchema,
  renderDemoSection,
  visitNodes,
} from "./demo-editor-document";

describe("원래 프론트 편집기와 MSW 문서 연결", () => {
  it.each(["1", "2"] as const)(
    "%s의 모든 문구·표·사진을 손실 없이 유지한다",
    (id) => {
      const source = fixture(id);
      const { draft, assets } = createDemoDraft(source, "시연 작품");
      draft.page_plan.forEach((section, index) => {
        const rendered = renderDemoSection(source, section)!;
        const before = visitNodes(source.root[index]);
        const after = visitNodes(rendered.root[0]);
        expect(after.map((n) => n.value)).toEqual(before.map((n) => n.value));
        expect(after.map((n) => n.tag)).toEqual(before.map((n) => n.tag));
        expect(after.map((n) => n.props?.style)).toEqual(
          before.map((n) => n.props?.style),
        );
        expect(
          after
            .filter((n) => n.tag === "img")
            .every((n) => assets.some((a) => a.imageId === n.props?.imageId)),
        ).toBe(true);
      });
      expect(
        demoSnapshotSchema.parse(
          JSON.parse(
            JSON.stringify({ draft, assets, source, status: "editing" }),
          ),
        ),
      ).toBeDefined();
    },
  );
  it("복제·글 서식·사진 삭제를 원본과 독립적으로 적용한다", () => {
    const source = fixture("2");
    const { draft } = createDemoDraft(source, "부채");
    const copy = {
      ...draft.page_plan[0],
      section_id: "duplicated",
      title: "수정된 제목",
      photo_id: "",
      textStyle: {
        align: "right" as const,
        bold: true,
        color: "#414954" as const,
      },
      variant: "soft" as const,
    };
    const doc = renderDemoSection(source, copy)!;
    const nodes = visitNodes(doc.root[0]);
    expect(nodes.some((n) => n.value === "수정된 제목")).toBe(true);
    expect(nodes.some((n) => n.tag === "img")).toBe(false);
    expect(doc.root[0].props?.style?.backgroundColor).toBe("#eef1f2");
    expect(source.root[0]).toEqual(fixture("2").root[0]);
    expect(nodes.every((n) => n.id.startsWith("duplicated-"))).toBe(true);
  });
  it.each(["1", "2"] as const)(
    "%s의 배경 변경과 전체 배치 변경이 모든 내용을 유지한다",
    (id) => {
      const source = fixture(id);
      const { draft } = createDemoDraft(source, "작품");
      for (const section of draft.page_plan) {
        const original = source.root.find(
          (node) => node.id === section.sourceSectionId,
        )!;
        if (section.variant !== "paper") {
          const paper = renderDemoSection(source, {
            ...section,
            variant: "paper",
          })!;
          expect(paper.root[0].props?.style?.backgroundColor).toBe("#ffffff");
        }
        for (const layout of ["image-first", "catalog-grid"]) {
          const result = renderDemoSection(source, section, layout)!;
          const before = visitNodes(original);
          const after = visitNodes(result.root[0]);
          expect(
            after
              .filter((n) => n.type === "text")
              .map((n) => n.value)
              .sort(),
          ).toEqual(
            before
              .filter((n) => n.type === "text")
              .map((n) => n.value)
              .sort(),
          );
          expect(
            after
              .filter((n) => n.tag === "img")
              .map((n) => n.props?.imageId)
              .sort(),
          ).toEqual(
            before
              .filter((n) => n.tag === "img")
              .map((n) => n.props?.imageId)
              .sort(),
          );
          expect(after.filter((n) => n.tag === "table")).toHaveLength(
            before.filter((n) => n.tag === "table").length,
          );
        }
      }
    },
  );
  it("원본에 없던 특징 제목·설명을 입력해도 미리보기에 반영한다", () => {
    let checked = 0;
    for (const id of ["1", "2"] as const) {
      const source = fixture(id);
      const { draft } = createDemoDraft(source, "작품");
      for (const section of draft.page_plan) {
        section.items.forEach((item, index) => {
          for (const field of ["title", "description"] as const) {
            if (item[field]) continue;
            const changed = structuredClone(section);
            changed.items[index][field] = "추가한 특징 내용";
            const rendered = renderDemoSection(source, changed)!;
            expect(
              visitNodes(rendered.root[0]).some(
                (node) => node.value === "추가한 특징 내용",
              ),
            ).toBe(true);
            checked++;
          }
        });
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
  it("원본 고유 배경을 보존하되 명시적으로 선택한 흰 배경을 적용한다", () => {
    const source = fixture("1");
    const { draft } = createDemoDraft(source, "찻잔");
    const section = draft.page_plan[4];
    expect(
      renderDemoSection(source, section)!.root[0].props?.style?.backgroundColor,
    ).toBe("#c5dbde");
    const changed = {
      ...section,
      variant: "paper" as const,
      backgroundEdited: true,
    };
    expect(
      renderDemoSection(source, changed)!.root[0].props?.style?.backgroundColor,
    ).toBe("#ffffff");
  });
});
