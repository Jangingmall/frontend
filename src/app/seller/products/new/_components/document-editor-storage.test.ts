import { beforeEach, describe, expect, it } from "vitest";

import { fixture } from "@/api/seller-demo/mock/document";
import { flattenDocument } from "@/utils/seller-studio/document";

import { createDemoDraft } from "./demo-editor-document";
import {
  contentImages,
  fileToDataUrl,
  parseDemoDocumentSnapshot,
  readServerDocumentSnapshot,
  serverDocumentStorageKey,
  writeServerDocumentSnapshot,
} from "./document-editor-storage";

const identity = { ownerId: 7, productId: 12, contentId: 18, version: 3 };
const snapshot = {
  document: fixture("1"),
  images: { upload: "data:image/png;base64,aGVsbG8=" },
  review: true,
};
beforeEach(() => localStorage.clear());

describe("전체 문서 브라우저 저장", () => {
  it("편집 문서, 업로드 이미지, 미리보기 상태를 서버 버전과 함께 복원한다", () => {
    writeServerDocumentSnapshot(identity, snapshot);
    expect(readServerDocumentSnapshot(identity)).toEqual(snapshot);
  });

  it("다른 계정·상품·콘텐츠·서버 버전의 로컬 문서를 적용하지 않는다", () => {
    writeServerDocumentSnapshot(identity, snapshot);
    for (const field of [
      "ownerId",
      "productId",
      "contentId",
      "version",
    ] as const)
      expect(
        readServerDocumentSnapshot({
          ...identity,
          [field]: identity[field] + 1,
        }),
      ).toBeUndefined();
  });

  it("손상된 저장본과 실행 가능한 이미지 URL을 복원하지 않는다", () => {
    localStorage.setItem(serverDocumentStorageKey(identity), "invalid JSON");
    expect(readServerDocumentSnapshot(identity)).toBeUndefined();
    expect(() =>
      writeServerDocumentSnapshot(identity, {
        ...snapshot,
        images: { upload: "javascript:alert(1)" },
      }),
    ).toThrow();
  });
});

describe("저장 가능한 사진 준비", () => {
  it("업로드 이미지를 페이지를 다시 열어도 읽을 수 있는 데이터 URL로 변환한다", async () => {
    expect(
      await fileToDataUrl(
        new File(["photo"], "photo.png", { type: "image/png" }),
      ),
    ).toBe("data:image/png;base64,cGhvdG8=");
  });
  it("빈 파일과 이미지가 아닌 파일은 읽기를 시작하기 전에 거절한다", async () => {
    await expect(
      fileToDataUrl(new File([], "empty.png", { type: "image/png" })),
    ).rejects.toThrow();
    await expect(
      fileToDataUrl(new File(["html"], "wrong.html", { type: "text/html" })),
    ).rejects.toThrow();
  });
  it("이미지 ID가 매칭되는 서버 variant와 명시적 src를 사용하고 순서로 추측하지 않는다", () => {
    const images = contentImages({
      contentId: 1,
      productId: 1,
      status: "DRAFT",
      version: 1,
      blocks: [
        {
          order: 0,
          tag: "img",
          imageVariants: [
            {
              url: "https://cdn.test/known/1280.webp",
              width: 1280,
              height: 800,
            },
          ],
        },
      ],
      reactDocument: {
        schemaVersion: "2.0",
        canvasWidth: 774,
        root: [
          {
            id: "known-photo",
            type: "element",
            tag: "img",
            props: { imageId: "known" },
          },
          {
            id: "unknown-photo",
            type: "element",
            tag: "img",
            props: { imageId: "unknown" },
          },
          {
            id: "explicit-photo",
            type: "element",
            tag: "img",
            props: { imageId: "explicit", src: "/seller-demos/1/hero.webp" },
          },
        ],
      },
    });
    expect(images).toEqual({
      known: "https://cdn.test/known/1280.webp",
      explicit: "/seller-demos/1/hero.webp",
    });
  });
});

describe("이전 데모 저장본 호환", () => {
  it("부채 사용 장면의 좁은 폭과 사진 잘림을 복구하면서 편집 문구·배경·사진을 보존한다", () => {
    const document = fixture("2");
    const section = document.root[4];
    section.id = `demo-page-5-${section.id}`;
    section.props!.style!.maxWidth = 666;
    section.props!.style!.backgroundColor = "#eef1f2";
    const nodes = flattenDocument({ ...document, root: [section] });
    nodes.find((node) => node.type === "text")!.value = "편집한 사용 장면";
    const photo = nodes.find((node) => node.tag === "img")!;
    photo.props!.imageId = "upload";
    photo.props!.style!.objectFit = "cover";
    const restored = parseDemoDocumentSnapshot(
      JSON.stringify({
        format: "document-v1",
        document,
        images: { upload: "data:image/png;base64,aGVsbG8=" },
        review: false,
        productId: 2,
      }),
    );
    expect(restored.document.root[4].props!.style!.maxWidth).toBe(774);
    expect(restored.document.root[4].props!.style!.backgroundColor).toBe(
      "#eef1f2",
    );
    const restoredNodes = flattenDocument(restored.document);
    expect(
      restoredNodes.find((node) => node.id === photo.id)?.props,
    ).toMatchObject({
      imageId: "upload",
      style: { objectFit: "contain" },
    });
    expect(
      restoredNodes.some((node) => node.value === "편집한 사용 장면"),
    ).toBe(true);
    expect(restored.document.root.filter((_, i) => i !== 4)).toEqual(
      document.root.filter((_, i) => i !== 4),
    );
    expect(restored.images.upload).toBe("data:image/png;base64,aGVsbG8=");
  });

  it("편집·복제·추가·삭제·정렬과 업로드 이미지를 raw 문서로 유지한다", () => {
    const source = fixture("1");
    const { draft, assets } = createDemoDraft(source, "저장한 작품");
    const original = draft.page_plan[0];
    draft.page_plan = [
      {
        ...original,
        section_id: "copied",
        title: "복제하여 수정",
        photo_id: "upload",
      },
      {
        section_id: "added",
        block_type: "statement",
        eyebrow: "",
        title: "추가한 페이지",
        body: "새 본문",
        variant: "paper",
        photo_id: "",
        photo_ids: [],
        items: [],
      },
      draft.page_plan[2],
    ];
    assets.push({
      ...assets[0],
      imageId: "upload",
      url: "data:image/png;base64,aGVsbG8=",
    });
    const restored = parseDemoDocumentSnapshot(
      JSON.stringify({ draft, assets, source, status: "result" }),
    );
    const nodes = flattenDocument(restored.document);
    expect(restored.document.root).toHaveLength(3);
    expect(
      nodes.filter((node) => node.type === "text").map((node) => node.value),
    ).toContain("복제하여 수정");
    expect(
      nodes.filter((node) => node.type === "text").map((node) => node.value),
    ).toContain("추가한 페이지");
    expect(nodes.filter((node) => node.tag === "img")).toHaveLength(6);
    expect(restored.images.upload).toBe("data:image/png;base64,aGVsbG8=");
    expect(restored.review).toBe(true);
  });

  it("새 저장 형식은 상품명·판매 정보까지 독립적으로 복원한다", () => {
    const product = {
      productId: 12,
      title: "직접 작성",
      price: 25000,
      stock: 3,
      status: "DRAFT",
    };
    const restored = parseDemoDocumentSnapshot(
      JSON.stringify({
        format: "document-v1",
        ...snapshot,
        productId: 12,
        product,
      }),
    );
    expect(restored.product).toEqual(product);
    expect(restored.productId).toBe(12);
    expect(restored.review).toBe(true);
    expect(restored.images).toEqual(snapshot.images);
  });
});
