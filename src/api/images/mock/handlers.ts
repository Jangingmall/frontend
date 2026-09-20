import { http, HttpResponse } from "msw";

import { mockOk } from "@/mocks/envelope";

/**
 * 이미지 업로드 도메인 MSW 핸들러. `POST /api/images/presigned-url`은 실제 BE 경로
 * 그대로 가로채고, 발급하는 업로드 URL도 이 파일이 같이 가로채는 목업 CDN 주소를 써서
 * 클라이언트 코드가 real/mock 양쪽에서 완전히 같은 흐름(presign → PUT)으로 동작하게
 * 한다 — 실제 파일은 어디에도 저장하지 않는다. `src/mocks/handlers.ts`에 등록된다.
 */
export const imageHandlers = [
  http.post("*/api/images/presigned-url", async ({ request }) => {
    const body = (await request.json()) as {
      variants: { name: string }[];
    };
    const imageId = `mock-image-${Math.random().toString(36).slice(2, 10)}`;
    return mockOk({
      imageId,
      uploads: body.variants.map((variant) => ({
        variant: variant.name,
        objectKey: `mock/${imageId}/${variant.name}`,
        presignedUrl: `https://mock-cdn.midam.local/uploads/${imageId}/${variant.name}`,
      })),
      expiresInSeconds: 300,
    });
  }),

  http.put("https://mock-cdn.midam.local/uploads/*", () => {
    return new HttpResponse(null, { status: 200 });
  }),
];
