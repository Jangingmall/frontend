import { clientFetch } from "@/lib/http/client";
import type { InquiryInput } from "@/types/inquiry";

import { mapInquiry, mapInquiryList } from "./mapper";
import {
  backendCreatedInquiryDto,
  backendInquiryInputDto,
  inquiryDto,
  inquiryInputDto,
  inquiryListDto,
} from "./validation";

export async function fetchInquiries(
  productId: number,
  excludeSecret: boolean,
  isMock: boolean,
  authenticated: boolean,
) {
  // 현재 BE는 비밀문의의 답변을 비작성자에게도 직렬화한다. 응답 후 마스킹으로 해결할 수 없다.
  if (!isMock) throw new Error("문의 목록 조회는 일시 중단되었습니다.");
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
  if (!isMock) {
    if (input.isSecret) throw new Error("현재 공개 문의만 등록할 수 있습니다.");
    const body = backendInquiryInputDto.parse({
      content: input.body,
      secret: input.isSecret,
    });
    const result = backendCreatedInquiryDto.parse(
      await clientFetch(`/api/products/${productId}/questions`, {
        method: "POST",
        body,
      }),
    );
    if (result.productId !== productId || result.secret !== body.secret)
      throw new Error("문의 등록 결과를 확인하지 못했습니다.");
    return mapInquiry({
      id: result.questionId,
      type: "상품 상세문의",
      title: "상품 문의",
      author: "작성자",
      createdAt: result.createdAt,
      isSecret: result.secret,
      canRead: true,
      status: "WAITING",
      body: result.content,
      reply: null,
    });
  }
  const data = await clientFetch<unknown>(
    `/api/mock/products/${productId}/inquiries`,
    { method: "POST", body: inquiryInputDto.parse(input) },
  );
  return mapInquiry(inquiryDto.parse(data));
}
