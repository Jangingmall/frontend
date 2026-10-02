import "server-only";

import { cache } from "react";

import { ApiError } from "@/lib/http/api-error";
import { readDemoCatalogue } from "@/mocks/catalogue-server";

import { fetchProductDetail } from "./detail-api";
import { mapProductDetailMock } from "./detail-mapper";
import { productDetailMockDto } from "./detail-validation";
export const fetchProductPageDetail = cache(
  async (id: number, preview = false) => {
    if (!preview) return fetchProductDetail(id, preview);
    try {
      return mapProductDetailMock(
        productDetailMockDto.parse(
          await readDemoCatalogue(`/api/mock/catalogue/products/${id}`),
        ),
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
);
