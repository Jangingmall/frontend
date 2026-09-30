import { clientFetch } from "@/lib/http/client";
import type { InquiryInput } from "@/types/inquiry";

import { mapInquiry, mapInquiryList } from "./mapper";
import { inquiryDto, inquiryInputDto, inquiryListDto } from "./validation";
export async function fetchDemoInquiries(
  productId: number,
  excludeSecret: boolean,
  authenticated: boolean,
) {
  return mapInquiryList(
    inquiryListDto.parse(
      await clientFetch(
        `/api/mock/products/${productId}/inquiries?excludeSecret=${excludeSecret}`,
        { auth: authenticated },
      ),
    ),
  );
}
export async function createDemoInquiry(
  productId: number,
  input: InquiryInput,
) {
  return mapInquiry(
    inquiryDto.parse(
      await clientFetch(`/api/mock/products/${productId}/inquiries`, {
        method: "POST",
        body: inquiryInputDto.parse(input),
      }),
    ),
  );
}
