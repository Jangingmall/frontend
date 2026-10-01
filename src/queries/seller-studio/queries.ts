import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSellerStudioRuntime } from "./runtime";
export const sellerKeys = { all: ["seller-studio"] as const };
export function useSellerProducts(
  page: number,
  enabled: boolean,
  ownerId: number,
) {
  const { api, scope, demo } = useSellerStudioRuntime();
  return useQuery({
    queryKey: [...sellerKeys.all, scope ?? ownerId, "products", page],
    queryFn: () => api.listSellerProducts(page),
    enabled: enabled && (demo || ownerId > 0),
    retry: false,
  });
}
export function useSellerContent(
  productId: number | undefined,
  enabled: boolean,
  ownerId: number,
) {
  const { api, scope, demo } = useSellerStudioRuntime();
  return useQuery({
    queryKey: [...sellerKeys.all, scope ?? ownerId, "content", productId],
    queryFn: ({ signal }) => api.getContent(productId!, signal),
    enabled: enabled && (demo || ownerId > 0) && !!productId,
    retry: false,
  });
}
export function useGeneration(
  productId: number | undefined,
  generationId: number | undefined,
  enabled: boolean,
  ownerId: number,
) {
  const { api, scope } = useSellerStudioRuntime();
  return useQuery({
    queryKey: [
      ...sellerKeys.all,
      scope ?? ownerId,
      "generation",
      productId,
      generationId,
    ],
    queryFn: ({ signal }) =>
      api.getGeneration(productId!, generationId!, signal),
    enabled: enabled && !!productId && !!generationId,
    retry: false,
    refetchInterval: (query) =>
      query.state.error ||
      ["COMPLETED", "FAILED", "DRAFT_READY"].includes(
        query.state.data?.status ?? "",
      )
        ? false
        : 2000,
  });
}
export function useSellerMutation<T, Variables>(
  mutationFn: (variables: Variables) => Promise<T>,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => client.invalidateQueries({ queryKey: sellerKeys.all }),
  });
}

export function useSellerProduct(
  productId: number,
  ownerId: number | undefined,
) {
  const { api, scope } = useSellerStudioRuntime();
  return useQuery({
    queryKey: [...sellerKeys.all, scope ?? ownerId, "product", productId],
    queryFn: ({ signal }) => api.getSellerProduct(productId, signal),
    retry: false,
  });
}
