import { publicEnv } from "@/lib/env";
import { ApiError } from "@/lib/http/api-error";

/** TODO BE·인프라 준비 및 docs/product-list-api-integration.md의 실서버 검증 후 설정을 활성화한다. */
export function assertProductListApiReady() {
  if (!publicEnv.apiMocking && !publicEnv.productListApi) {
    throw new ApiError(503, { errorCode: "PRODUCT_LIST_API_NOT_READY" });
  }
}

export function canUseProductCrafts() {
  return publicEnv.apiMocking || publicEnv.productListApi === true;
}
