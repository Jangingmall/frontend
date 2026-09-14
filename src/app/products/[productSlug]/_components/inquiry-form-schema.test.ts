import { describe, expect, it } from "vitest";

import { inquiryFormSchema } from "./inquiry-form-schema";

const valid = {
  type: "상품 상세문의",
  title: "",
  body: "문의합니다",
  isSecret: false,
};
describe("상품 문의 폼 검증", () => {
  it("유형과 공백 아닌 내용을 요구한다", () => {
    expect(inquiryFormSchema.safeParse({ ...valid, type: "" }).success).toBe(
      false,
    );
    expect(
      inquiryFormSchema.safeParse({ ...valid, body: "  \n " }).success,
    ).toBe(false);
    expect(
      inquiryFormSchema.parse({ ...valid, body: "  문의합니다  " }).body,
    ).toBe("문의합니다");
  });
  it("기타는 제목이 필수이며 제목 30자와 본문 2000자를 허용한다", () => {
    expect(
      inquiryFormSchema.safeParse({ ...valid, type: "기타" }).success,
    ).toBe(false);
    expect(
      inquiryFormSchema.safeParse({
        ...valid,
        type: "기타",
        title: "가".repeat(30),
        body: "가".repeat(2000),
      }).success,
    ).toBe(true);
    expect(
      inquiryFormSchema.safeParse({
        ...valid,
        type: "기타",
        title: "가".repeat(31),
      }).success,
    ).toBe(false);
    expect(
      inquiryFormSchema.safeParse({ ...valid, body: "가".repeat(2001) })
        .success,
    ).toBe(false);
  });
});
