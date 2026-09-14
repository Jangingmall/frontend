import { clientFetch } from "@/lib/http/client";
import type { InquiryInput } from "@/types/inquiry";

import { mapInquiry, mapInquiryList } from "./mapper";
import { inquiryDto, inquiryInputDto, inquiryListDto } from "./validation";

export async function fetchInquiries(
  productId: number,
  excludeSecret: boolean,
  isMock: boolean,
  authenticated: boolean,
) {
  if (!isMock) throw new Error("상품 문의를 준비 중입니다.");
  const data = await clientFetch<unknown>(
    `/api/mock/products/${productId}/inquiries?excludeSecret=${excludeSecret}`,
    { auth: authenticated },
  );
  return mapInquiryList(inquiryListDto.parse(data));
}
export async function createInquiry(
  productId: number,
  input: InquiryInput,
  isMock: boolean,
) {
  if (!isMock) throw new Error("상품 문의 등록을 준비 중입니다.");
  const data = await clientFetch<unknown>(
    `/api/mock/products/${productId}/inquiries`,
    { method: "POST", body: inquiryInputDto.parse(input) },
  );
  return mapInquiry(inquiryDto.parse(data));
}
