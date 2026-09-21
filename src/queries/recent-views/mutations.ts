"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { clearRecentViews } from "@/api/recent-views/api";

import { recentViewKeys } from "./keys";

/** 만들어두되 v1 화면엔 아직 연결하지 않는다(Figma에 전체 삭제 버튼이 안 보임). */
export function useClearRecentViewsMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: clearRecentViews,
    onSuccess: () => client.invalidateQueries({ queryKey: recentViewKeys.all }),
  });
}
