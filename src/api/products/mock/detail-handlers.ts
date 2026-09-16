import { type DefaultBodyType, http, type PathParams } from "msw";

import { mockError, mockOk } from "@/mocks/envelope";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";

import { getProductDetailMockDto } from "./detail-fixtures";

export const productDetailHandlers = [
  http.get<
    PathParams,
    DefaultBodyType,
    ApiErrorResponse | ApiResponse<unknown>
  >("*/api/products/:productId", ({ params }) => {
    const id = Number(params.productId);
    if (id === 997) return mockError(503, "SERVICE_UNAVAILABLE");
    const dto = getProductDetailMockDto(id);
    return dto ? mockOk(dto) : mockError(404, "PRODUCT_NOT_FOUND");
  }),
];
