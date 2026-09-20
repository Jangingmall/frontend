import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { OrderClaimPhotoField } from "./OrderClaimPhotoField";

function file(name: string, sizeBytes = 1024): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type: "image/png" });
}

function Wrapper() {
  const [photos, setPhotos] = useState<File[]>([]);
  return <OrderClaimPhotoField value={photos} onChange={setPhotos} />;
}

describe("OrderClaimPhotoField", () => {
  it("필수가 아니면 별표를 표시하지 않는다", () => {
    render(<OrderClaimPhotoField value={[]} onChange={() => {}} />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("필수면 별표를 표시한다", () => {
    render(<OrderClaimPhotoField value={[]} onChange={() => {}} required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("사진을 선택하면 미리보기가 추가되고 삭제할 수 있다", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, file("photo.png"));

    expect(screen.getByLabelText("photo.png 삭제")).toBeInTheDocument();

    await user.click(screen.getByLabelText("photo.png 삭제"));
    expect(screen.queryByLabelText("photo.png 삭제")).not.toBeInTheDocument();
  });

  it("사진을 삭제하면 미리보기 object URL을 해제한다(Codex 리뷰 F2)", async () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const user = userEvent.setup();
    render(<Wrapper />);

    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, file("photo.png"));
    await user.click(screen.getByLabelText("photo.png 삭제"));

    expect(revokeSpy).toHaveBeenCalled();
    revokeSpy.mockRestore();
  });

  it("10MB를 넘는 사진은 에러를 보여주고 추가되지 않는다", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, file("too-big.png", 11 * 1024 * 1024));

    expect(
      screen.getByText("사진은 각 10MB 이내로 첨부해주세요."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("too-big.png 삭제")).not.toBeInTheDocument();
  });
});
