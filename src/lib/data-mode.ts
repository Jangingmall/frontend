type ProductQuery = {
  materials?: string[];
  crafts?: string[];
  hasGiftWrap?: boolean;
  sort?: string;
};

export type DataMode = "msw" | "api";

export function resolveDataMode(mode?: string, legacy?: string): DataMode {
  if (mode && mode !== "msw" && mode !== "api")
    throw new Error("DATA_MODE must be msw or api");
  if (mode === "api" && legacy === "enabled")
    throw new Error("DATA_MODE conflicts with API_MOCKING");
  return mode === "msw" || legacy === "enabled" ? "msw" : "api";
}

/** API 모드에서 복원하는 화면 전용 시연 요청. 인증/세션/실제 거래 경로는 포함하지 않는다. */
export function isDemoFeatureRequest(path: string, method = "GET") {
  const pathname = path.split(/[?#]/, 1)[0];
  const read = method.toUpperCase() === "GET";
  if (
    read &&
    /^\/api\/mock\/catalogue\/products(?:\/(?:\d+|crafts|materials))?$/.test(
      pathname,
    )
  )
    return true;
  if (
    /^\/api\/mock\/products\/\d+\/(?:reviews|inquiries|restock|actions|cart-selections)$/.test(
      pathname,
    )
  ) {
    const action = pathname.slice(pathname.lastIndexOf("/") + 1);
    return (
      {
        reviews: ["GET"],
        inquiries: ["GET", "POST"],
        restock: ["GET", "POST"],
        actions: ["GET", "PATCH"],
        "cart-selections": ["POST"],
      } as Record<string, string[]>
    )[action].includes(method.toUpperCase());
  }
  if (
    /^\/api\/mock\/purchase\/(?:cart|benefits|benefits\/apply|orders)$/.test(
      pathname,
    )
  ) {
    const action = pathname.replace("/api/mock/purchase/", "");
    return (
      {
        cart: ["GET", "PUT"],
        benefits: ["GET"],
        "benefits/apply": ["POST"],
        orders: ["POST"],
      } as Record<string, string[]>
    )[action].includes(method.toUpperCase());
  }
  return false;
}

/** 실제 API는 통과시키고 시연 네임스페이스는 런타임에서 허용 목록을 확인한다. */
export function shouldMockRequest(mode: DataMode, path: string) {
  return (
    /^\/api(?:\/|$)/.test(path) &&
    (mode === "msw" || path.startsWith("/api/mock/"))
  );
}

export function isMockProductQuery(mode: DataMode, query: ProductQuery) {
  return (
    mode === "msw" ||
    Boolean(
      query.materials?.length ||
      query.crafts?.length ||
      query.hasGiftWrap ||
      (query.sort &&
        !["popular", "newest", "price-asc", "price-desc"].includes(query.sort)),
    )
  );
}

/** 문서상 존재하지 않거나 현재 구현으로 안전하게 제공할 수 없는 화면 기능. */
export const demoFeatures = {
  productFilters: "소재·공예 종목·선물 포장 검색 및 판매·찜 정렬",
  productInquiries: "비밀 답변 노출 문제가 해결될 때까지 문의 시연",
  photoReviews: "사진 후기 필터 및 공개 이미지 URL 미제공",
  restock: "재입고 알림 신청",
  naver: "네이버 로그인",
  purchaseExtras: "옵션·쿠폰·적립금·무통장입금 시연",
} as const;
