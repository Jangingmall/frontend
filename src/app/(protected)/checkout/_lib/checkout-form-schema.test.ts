import { describe, expect, it } from "vitest";

import {
  checkoutFormSchema,
  EMPTY_CHECKOUT_FORM,
} from "./checkout-form-schema";
const valid = {
  ...EMPTY_CHECKOUT_FORM,
  customerName: "홍길동",
  email: "midam@example.com",
  customerPhoneMiddle: "1234",
  customerPhoneLast: "5678",
  recipientName: "김미담",
  recipientPhoneMiddle: "123",
  recipientPhoneLast: "4567",
  postcode: "00000",
  address: "샘플 주소",
};
describe("결제 입력 검증", () => {
  it("필수 입력 누락과 잘못된 이메일을 거절한다", () => {
    expect(checkoutFormSchema.safeParse(EMPTY_CHECKOUT_FORM).success).toBe(
      false,
    );
    expect(
      checkoutFormSchema.safeParse({ ...valid, email: "midam" }).success,
    ).toBe(false);
  });
  it("전화 앞자리 목록과 길이를 서버 정책으로 단정하지 않는다", () => {
    expect(
      checkoutFormSchema.safeParse({
        ...valid,
        customerPhoneFirst: "019",
        recipientPhoneFirst: "02",
      }).success,
    ).toBe(true);
  });
  it("전화의 비숫자는 거절하고 선택 메모와 상세주소는 비워도 된다", () => {
    expect(
      checkoutFormSchema.safeParse({ ...valid, customerPhoneMiddle: "a123" })
        .success,
    ).toBe(false);
    expect(checkoutFormSchema.safeParse(valid).success).toBe(true);
  });
});
