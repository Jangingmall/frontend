import { type DefaultBodyType, delay, http, type PathParams } from "msw";

import {
  inquiryDto,
  inquiryInputDto,
  inquiryListDto,
} from "@/api/inquiries/validation";
import { mockError, mockOk } from "@/mocks/envelope";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";
import type { ProductInquiry } from "@/types/inquiry";

import { createInquiryFixtures, type StoredInquiry } from "./fixtures";

const inquiries = new Map<number, StoredInquiry[]>();
export function resetInquiryMock() {
  inquiries.clear();
}
function getInquiries(productId: number) {
  if (!inquiries.has(productId))
    inquiries.set(productId, createInquiryFixtures(productId));
  return inquiries.get(productId)!;
}
/** mock 회원의 발급·갱신 토큰만 인정한다. 그 외 문자열은 익명이다. */
function getViewer(request: Request) {
  const token = request.headers.get("Authorization");
  return token === "Bearer mock-access-token" ||
    token === "Bearer mock-access-token-refreshed"
    ? 1
    : null;
}
function serializeInquiry(
  item: StoredInquiry,
  viewer: number | null,
): ProductInquiry {
  const canRead = !item.isSecret || viewer === item.ownerId;
  // ownerId 및 비밀 데이터는 직렬화하기 전에 제거한다.
  return {
    id: item.id,
    type: item.type,
    author: item.author,
    createdAt: item.createdAt,
    isSecret: item.isSecret,
    status: item.status,
    canRead,
    title: canRead ? item.title : "비밀글입니다.",
    body: canRead ? item.body : null,
    reply: canRead ? item.reply : null,
  };
}
export const inquiryHandlers = [
  http.get<
    PathParams,
    DefaultBodyType,
    ApiErrorResponse | ApiResponse<unknown>
  >("*/api/mock/products/:productId/inquiries", ({ params, request }) => {
    if (Number(params.productId) === 997)
      return mockError(503, "INTERNAL_ERROR");
    const all = getInquiries(Number(params.productId));
    const excludeSecret =
      new URL(request.url).searchParams.get("excludeSecret") === "true";
    return mockOk(
      inquiryListDto.parse({
        items: all
          .filter((item) => !excludeSecret || !item.isSecret)
          .map((item) => serializeInquiry(item, getViewer(request))),
        totalCount: all.length,
      }),
    );
  }),
  http.post<
    PathParams,
    DefaultBodyType,
    ApiErrorResponse | ApiResponse<unknown>
  >("*/api/mock/products/:productId/inquiries", async ({ params, request }) => {
    const viewer = getViewer(request);
    if (!viewer) return mockError(401, "UNAUTHORIZED");
    const input = inquiryInputDto.safeParse(
      await request.json().catch(() => null),
    );
    if (!input.success) return mockError(400, "INVALID_INPUT");
    await delay(250);
    if (Number(params.productId) === 997)
      return mockError(503, "INTERNAL_ERROR");
    const all = getInquiries(Number(params.productId));
    const item: StoredInquiry = {
      ...input.data,
      id: Math.max(0, ...all.map((entry) => entry.id)) + 1,
      title: input.data.type === "기타" ? input.data.title : input.data.type,
      ownerId: viewer,
      author: "김미담",
      createdAt: "2026-09-14",
      canRead: true,
      status: "WAITING",
      reply: null,
    };
    all.unshift(item);
    return mockOk(inquiryDto.parse(serializeInquiry(item, viewer)), 201);
  }),
];
