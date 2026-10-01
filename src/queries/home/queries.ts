"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHomeDemoGiftsClient } from "@/api/home/demo-client";
import type { Page } from "@/types/api";
import type { GiftThemeId } from "@/types/gift-theme";
import type { ProductSummary } from "@/types/product";

import { homeKeys } from "./keys";

export function useHomeGifts(
  theme: GiftThemeId,
  enabled: boolean,
  initialData?: Page<ProductSummary>,
) {
  return useQuery({
    queryKey: homeKeys.gifts(theme),
    queryFn: ({ signal }) => fetchHomeDemoGiftsClient(theme, signal),
    initialData,
    enabled,
    staleTime: 60000,
  });
}
