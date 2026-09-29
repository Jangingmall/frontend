import { publicEnv } from "@/lib/env";
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
  // 현재 BE는 비밀문의의 답변을 비작성자에게도 직렬화한다. 응답 후 마스킹으로 해결할 수 없다.
  if (!publicEnv.apiMocking || !isMock)
    throw new Error("문의 목록 조회는 일시 중단되었습니다.");
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
  if (!publicEnv.apiMocking || !isMock)
    throw new Error("문의 등록은 일시 중단되었습니다.");
  const data = await clientFetch<unknown>(
    `/api/mock/products/${productId}/inquiries`,
    { method: "POST", body: inquiryInputDto.parse(input) },
  );
  return mapInquiry(inquiryDto.parse(data));
}
