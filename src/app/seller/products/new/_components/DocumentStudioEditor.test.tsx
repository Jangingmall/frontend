import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import type { StudioDocument } from "@/utils/seller-studio/document";

import { DocumentStudioEditor } from "./DocumentStudioEditor";

vi.mock("./ServerStudioReview", () => ({
  ServerStudioReview: () => <div>상품 미리보기</div>,
}));
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 200,
    bottom: 240,
    left: 300,
    right: 800,
    width: 500,
    height: 40,
    x: 300,
    y: 200,
    toJSON: () => ({}),
  });
});
const document: StudioDocument = {
  schemaVersion: "2.0",
  canvasWidth: 774,
  root: ["첫째", "둘째"].map((title, i) => ({
    id: `page${i}`,
    type: "element",
    tag: "section",
    props: { style: { backgroundColor: "#eee9df" } },
    children: [
      {
        id: `paragraph${i}`,
        type: "element",
        tag: "p",
        children: [{ id: `text${i}`, type: "text", value: title }],
      },
    ],
  })),
};
function setup(options = {}) {
  const save = vi.fn().mockResolvedValue(undefined);
  const view = render(
    <DocumentStudioEditor
      initialDocument={document}
      initialImages={{}}
      productId={1}
      onSave={save}
      onUpload={vi.fn()}
      {...options}
    />,
  );
  return { ...view, save };
}
it("원본 두 섹션을 유지하고 선택한 페이지 바로 뒤에 새 영역을 삽입한다", () => {
  const { container } = setup();
  fireEvent.click(screen.getByRole("button", { name: "페이지 1 편집" }));
  fireEvent.click(screen.getByRole("button", { name: "페이지 추가" }));
  fireEvent.click(screen.getByRole("button", { name: "새 영역 추가" }));
  const pages = container.querySelectorAll(".ss-canvas > .ss-page");
  expect(pages).toHaveLength(3);
  expect(pages[0]).toHaveTextContent("첫째");
  expect(pages[2]).toHaveTextContent("둘째");
  fireEvent.click(screen.getByRole("button", { name: "실행 취소" }));
  expect(container.querySelectorAll(".ss-page")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "다시 실행" }));
  expect(container.querySelectorAll(".ss-page")).toHaveLength(3);
});
it("섹션 삭제는 확인해야 반영되고 취소하면 유지된다", () => {
  const { container } = setup();
  fireEvent.click(screen.getByRole("button", { name: "페이지 1 편집" }));
  fireEvent.click(screen.getByRole("button", { name: "페이지 삭제" }));
  expect(container.querySelectorAll(".ss-page")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "취소" }));
  expect(container.querySelectorAll(".ss-page")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "페이지 삭제" }));
  fireEvent.click(
    within(
      screen.getByRole("dialog", { name: "해당 내용을 삭제할까요?" }),
    ).getByRole("button", { name: "삭제" }),
  );
  expect(container.querySelectorAll(".ss-page")).toHaveLength(1);
  expect(container.querySelector(".ss-page")).toHaveTextContent("둘째");
});
it("글꼴 크기 6개와 선택 문구만 변경하며 임의 배경에 기본 색상을 선택하지 않는다", () => {
  const { container } = setup();
  fireEvent.click(screen.getAllByRole("textbox", { name: "텍스트 편집" })[0]);
  expect(screen.getAllByRole("option")).toHaveLength(6);
  fireEvent.change(screen.getByLabelText("글꼴 크기"), {
    target: { value: "headline" },
  });
  fireEvent.click(screen.getByRole("button", { name: "오른쪽 정렬" }));
  const texts = screen.getAllByRole("textbox", { name: "텍스트 편집" });
  expect(texts[0].parentElement).toHaveStyle({
    fontSize: "28px",
    textAlign: "right",
  });
  expect(texts[1].parentElement).not.toHaveStyle({ fontSize: "28px" });
  expect(
    container.querySelectorAll('.ss-swatch[aria-pressed="true"]'),
  ).toHaveLength(0);
});
it("저장 완료 후 알림을 띄우고 미리보기에서 기기를 전환하며 제작 완료는 비활성화한다", async () => {
  const { save, container } = setup();
  fireEvent.click(screen.getByRole("button", { name: "임시 저장" }));
  await screen.findByText("임시 저장되었습니다");
  expect(save).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "제작 완료" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "미리보기" }));
  expect(screen.getByText("상품 미리보기")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "뒤로가기" }));
  expect(container.querySelectorAll(".ss-page")).toHaveLength(2);
});
it("저장 실패 후에도 편집 내용과 다시 저장할 수 있는 상태를 유지한다", async () => {
  const onSave = vi.fn().mockRejectedValue(new Error("저장 오류"));
  setup({ onSave });
  const text = screen.getAllByRole("textbox", { name: "텍스트 편집" })[0];
  text.textContent = "수정 유지";
  fireEvent.blur(text);
  fireEvent.click(screen.getByRole("button", { name: "임시 저장" }));
  await screen.findByRole("alert");
  expect(screen.getByText("수정 유지")).toBeVisible();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "임시 저장" }),
    ).not.toBeDisabled(),
  );
  expect(screen.queryByText("임시 저장되었습니다")).not.toBeInTheDocument();
});

it("포커스가 남아 있는 편집도 새로고침 전에 경고한다", () => {
  setup();
  const field = screen.getAllByRole("textbox")[0];
  field.textContent = "입력 중";
  fireEvent.input(field);
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
});

it("여러 사진을 한 번에 첨부할 수 있다", async () => {
  let count = 0;
  setup({
    onUpload: async () => ({
      imageId: `upload-${++count}`,
      url: "/seller-demos/1/hero.webp",
    }),
  });
  fireEvent.click(screen.getByRole("button", { name: "사진 추가" }));
  fireEvent.change(screen.getByLabelText("편집 사진 첨부"), {
    target: {
      files: [
        new File(["a"], "a.png", { type: "image/png" }),
        new File(["b"], "b.png", { type: "image/png" }),
      ],
    },
  });
  await screen.findByRole("button", { name: "사진 2 사용" });
  expect(screen.getByRole("button", { name: "사진 1 사용" })).toBeEnabled();
});

it("선택 사진 파일 교체는 같은 사진을 사용하는 페이지에 반영되고 되돌릴 수 있다", async () => {
  const initialDocument: StudioDocument = {
    ...document,
    root: document.root.map((section, index) => ({
      ...section,
      children: [
        ...(section.children ?? []),
        {
          id: `photo${index}`,
          type: "element",
          tag: "img",
          props: { imageId: "old", alt: `작품 ${index}` },
        },
      ],
    })),
  };
  const { container } = setup({
    initialDocument,
    initialImages: { old: "/seller-demos/1/hero.webp" },
    onUpload: async () => ({
      imageId: "new",
      url: "/seller-demos/1/detail.webp",
    }),
  });
  fireEvent.click(screen.getByAltText("작품 0"));
  fireEvent.click(screen.getByRole("button", { name: "선택 사진 교체" }));
  fireEvent.change(screen.getByLabelText("편집 사진 첨부"), {
    target: { files: [new File(["a"], "a.png", { type: "image/png" })] },
  });
  await waitFor(() =>
    expect(screen.getByAltText("작품 1")).toHaveAttribute(
      "src",
      "http://localhost:3000/seller-demos/1/detail.webp",
    ),
  );
  expect(
    container.querySelectorAll('.sa-document img[src$="detail.webp"]'),
  ).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "실행 취소" }));
  expect(
    container.querySelectorAll('.sa-document img[src$="hero.webp"]'),
  ).toHaveLength(2);
});

it("도움말 바깥 클릭·건너뛰기 후 미리보기를 왕복해도 닫힌 상태를 유지한다", () => {
  setup();
  expect(
    screen.getByRole("button", { name: "튜토리얼 시작하기" }),
  ).toBeDisabled();
  fireEvent.pointerDown(
    screen.getByRole("heading", { name: "상세페이지 편집" }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "편집 도움말" }));
  fireEvent.click(screen.getByRole("button", { name: "건너뛰기" }));
  fireEvent.click(screen.getByRole("button", { name: "미리보기" }));
  fireEvent.click(screen.getByRole("button", { name: "뒤로가기" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
