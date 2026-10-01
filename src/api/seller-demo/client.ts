import { uploadPublicImage } from "@/api/images/api";
import { createSellerStudioApi } from "@/api/seller-studio/api";
import { clientFetch } from "@/lib/http/client";
import { startMockWorker } from "@/mocks/start-browser";

import type { SellerDemoId } from "./scenarios";

export function createSellerDemoRuntime(id: SellerDemoId, session: string) {
  const fetcher: typeof clientFetch = async (path, options) => {
    await startMockWorker();
    return clientFetch(`/api/mock/seller-demos/${id}${path}`, {
      ...options,
      auth: false,
      headers: { ...options?.headers, "X-Studio-Session": session },
    });
  };
  return {
    api: createSellerStudioApi(fetcher),
    uploadImage: (file: File, purpose: "PRODUCT" | "ARTISAN" | "CONTENT") =>
      uploadPublicImage(file, purpose, fetcher),
    scope: `seller-demo-${id}-${session}`,
    demo: true,
    studioUrl: () => `/seller/products/new/${id}`,
  };
}
