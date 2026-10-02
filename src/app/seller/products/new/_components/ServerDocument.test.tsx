import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import type { StudioDocument } from "@/utils/seller-studio/document";

import { ServerDocument } from "./ServerDocument";

const document: StudioDocument = {
  schemaVersion: "2.0",
  canvasWidth: 774,
  root: [
    {
      id: "page",
      type: "element",
      tag: "section",
      children: [
        {
          id: "title",
          type: "element",
          tag: "h2",
          children: [{ id: "text", type: "text", value: "원래 제목" }],
        },
        {
          id: "photo",
          type: "element",
          tag: "img",
          props: { src: "/seller-demos/1/hero.webp" },
        },
      ],
    },
  ],
};

it("편집 모드에서 개별 문구를 선택하고 원래 노드 ID로 변경한다", () => {
  const onSelectNode = vi.fn();
  const onChangeText = vi.fn();
  render(
    <ServerDocument
      document={document}
      images={{}}
      selectedNodeId="text"
      onSelectNode={onSelectNode}
      onChangeText={onChangeText}
    />,
  );
  const field = screen.getByRole("textbox", { name: "텍스트 편집" });
  fireEvent.click(field);
  expect(onSelectNode).toHaveBeenCalledWith("text");
  field.textContent = "수정한 제목";
  fireEvent.blur(field);
  expect(onChangeText).toHaveBeenCalledWith("text", "수정한 제목");
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
    "수정한 제목",
  );
});

it("미리보기는 편집 컨트롤 없이 렌더링한다", () => {
  render(<ServerDocument document={document} images={{}} />);
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
    "원래 제목",
  );
});

it("사진을 선택하면 원본 사진 노드를 전달한다", () => {
  const select = vi.fn();
  render(
    <ServerDocument document={document} images={{}} onSelectNode={select} />,
  );
  fireEvent.click(screen.getByRole("img"));
  expect(select).toHaveBeenCalledWith("photo");
});

it("로드 실패 사진도 다시 선택해 교체할 수 있다", () => {
  const select = vi.fn();
  render(
    <ServerDocument document={document} images={{}} onSelectNode={select} />,
  );
  fireEvent.error(screen.getByRole("img"));
  fireEvent.click(
    screen.getByRole("button", { name: "불러오지 못한 사진 선택" }),
  );
  expect(select).toHaveBeenCalledWith("photo");
});

it("입력 중인 문구를 알리고 줄바꿈을 포함한 화면 텍스트로 저장한다", () => {
  const change = vi.fn();
  const pending = vi.fn();
  render(
    <ServerDocument
      document={document}
      images={{}}
      onSelectNode={vi.fn()}
      onChangeText={change}
      onPendingText={pending}
    />,
  );
  const field = screen.getByRole("textbox");
  field.innerHTML = "첫 줄<div>둘째 줄</div>";
  Object.defineProperty(field, "innerText", { value: "첫 줄\n둘째 줄" });
  fireEvent.input(field);
  expect(pending).toHaveBeenLastCalledWith(true);
  fireEvent.blur(field);
  expect(change).toHaveBeenCalledWith("text", "첫 줄\n둘째 줄");
  expect(pending).toHaveBeenLastCalledWith(false);
});

it("붙여넣기만 한 문구도 저장되지 않은 입력으로 표시한다", () => {
  const pending = vi.fn();
  render(
    <ServerDocument
      document={document}
      images={{}}
      onSelectNode={vi.fn()}
      onChangeText={vi.fn()}
      onPendingText={pending}
    />,
  );
  const field = screen.getByRole("textbox");
  const range = window.document.createRange();
  range.selectNodeContents(field);
  window.getSelection()?.removeAllRanges();
  window.getSelection()?.addRange(range);
  fireEvent.paste(field, { clipboardData: { getData: () => "붙여넣은 내용" } });
  expect(field).toHaveTextContent("붙여넣은 내용");
  expect(pending).toHaveBeenLastCalledWith(true);
});
