"use client";
import { createContext, useContext } from "react";

import { uploadPublicImage } from "@/api/images/api";
import * as api from "@/api/seller-studio/api";

export interface SellerStudioRuntime {
  api: api.SellerStudioApi;
  uploadImage: typeof uploadPublicImage;
  scope?: string;
  demo?: boolean;
  fixedSale?: { price: number; stock: number };
  setNavigationGuard?: (guard: (() => boolean) | null) => void;
  canNavigate?: () => boolean;
  initialInput?: {
    values: { productName: string; howMade: string; careTips: string };
    files: File[];
  };
  studioUrl: (productId: number, generationId?: number) => string;
}
export const SellerStudioRuntimeContext = createContext<SellerStudioRuntime>({
  api,
  uploadImage: uploadPublicImage,
  studioUrl: (productId, generationId) =>
    `/seller/products/new?productId=${productId}${generationId ? `&generationId=${generationId}` : ""}`,
});
export const useSellerStudioRuntime = () =>
  useContext(SellerStudioRuntimeContext);
