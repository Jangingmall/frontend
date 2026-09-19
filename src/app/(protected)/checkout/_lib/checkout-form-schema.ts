import { z } from "zod";
const required = (label: string) =>
  z.string().trim().min(1, `${label}을 입력해 주세요.`);
const phone = z.string().regex(/^\d+$/, "숫자로 입력해 주세요.");
export const checkoutFormSchema = z.object({
  customerName: required("주문자 이름"),
  email: z.email("이메일을 확인해 주세요."),
  customerPhoneFirst: phone,
  customerPhoneMiddle: phone,
  customerPhoneLast: phone,
  recipientName: required("수령인 이름"),
  recipientPhoneFirst: phone,
  recipientPhoneMiddle: phone,
  recipientPhoneLast: phone,
  postcode: required("우편번호"),
  address: required("주소"),
  addressDetail: z.string(),
  memo: z.string(),
  memoText: z.string(),
});
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export const EMPTY_CHECKOUT_FORM: CheckoutFormValues = {
  customerName: "",
  email: "",
  customerPhoneFirst: "010",
  customerPhoneMiddle: "",
  customerPhoneLast: "",
  recipientName: "",
  recipientPhoneFirst: "010",
  recipientPhoneMiddle: "",
  recipientPhoneLast: "",
  postcode: "",
  address: "",
  addressDetail: "",
  memo: "",
  memoText: "",
};
