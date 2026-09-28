import { describe, expect, it } from "vitest";

import { exampleAssets, exampleDraft } from "./studio-fixture";
import { createDraft, historyReducer, readSavedDraft } from "./studio-state";

describe("판매자 스튜디오 상태", () => {
  it("사진 교체도 실행 취소 시 원본과 참조를 함께 복원한다", () => {
    const start = {
      draft: exampleDraft,
      assets: exampleAssets,
      past: [],
      future: [],
    };
    const changed = historyReducer(start, {
      type: "edit",
      draft: exampleDraft,
      assets: exampleAssets.map((asset) => ({
        ...asset,
        url: "data:image/png;base64,YQ==",
      })),
    });
    expect(historyReducer(changed, { type: "undo" }).assets).toEqual(
      exampleAssets,
    );
  });
  it("입력한 상품 정보만으로 초안을 만들고 사진 참조를 유지한다", () => {
    const draft = createDraft(
      { name: "수제 찻잔", making: "손으로 빚었습니다", care: "손세척하세요" },
      exampleAssets,
    );
    expect(draft.product_name).toBe("수제 찻잔");
    expect(draft.page_plan.at(-1)?.body).toBe("손세척하세요");
    expect(
      draft.page_plan.some(
        (page) => page.photo_id === exampleAssets[1].imageId,
      ),
    ).toBe(true);
    expect(JSON.stringify(draft)).not.toContain("금속");
  });
  it("필수 정보와 8장 제한을 검증한다", () => {
    expect(() =>
      createDraft({ name: "상품", making: "설명", care: "" }, exampleAssets),
    ).toThrow();
    expect(() =>
      createDraft(
        { name: "상품", making: "설명", care: "관리" },
        Array(9).fill(exampleAssets[0]),
      ),
    ).toThrow();
  });
  it("실행 취소 후 새 편집을 하면 재실행 이력을 비운다", () => {
    const start = {
      draft: exampleDraft,
      assets: exampleAssets,
      past: [],
      future: [],
    };
    const changed = historyReducer(start, {
      type: "edit",
      draft: { ...exampleDraft, product_name: "변경" },
    });
    const undo = historyReducer(changed, { type: "undo" });
    expect(undo.draft).toEqual(exampleDraft);
    const next = historyReducer(undo, {
      type: "edit",
      draft: { ...exampleDraft, product_name: "새 수정" },
    });
    expect(next.future).toEqual([]);
  });
  it("복원 시 외부 URL과 손상된 사진 참조를 거부한다", () => {
    const record = {
      draft: exampleDraft,
      assets: exampleAssets,
      status: "draft",
    };
    expect(readSavedDraft(JSON.stringify(record)).draft).toEqual(exampleDraft);
    expect(() =>
      readSavedDraft(
        JSON.stringify({
          ...record,
          assets: [{ ...exampleAssets[0], url: "javascript:alert(1)" }],
        }),
      ),
    ).toThrow();
    expect(() =>
      readSavedDraft(JSON.stringify({ ...record, assets: [] })),
    ).toThrow();
  });
});
