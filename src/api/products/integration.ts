import { publicEnv } from "@/lib/env";
import { ApiError } from "@/lib/http/api-error";

/** TODO BE·인프라 준비 및 docs/product-list-api-integration.md의 실서버 검증 후 설정을 활성화한다. */
export function assertProductListApiReady() {
  if (!publicEnv.apiMocking && !publicEnv.productListApi) {
    throw new ApiError(503, { errorCode: "PRODUCT_LIST_API_NOT_READY" });
  }
}

export function canUseProductCrafts() {
  // TODO 공예 종목 endpoint와 목록 필터 계약 구현·검증 후 별도로 활성화한다.
  return publicEnv.apiMocking;
}

export function canUseProductMaterials() {
  // TODO PD 분류 조건(subcategoryId/category) 및 목록 필터 계약 검증 후 별도로 활성화한다.
  return publicEnv.apiMocking;
}
