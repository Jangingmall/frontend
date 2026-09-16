import type { ReviewFilters } from "@/types/review";

export const reviewKeys = {
  all: ["reviews"] as const,
  list: (id: number, filters: ReviewFilters, isMock: boolean) =>
    ["reviews", id, filters, isMock] as const,
};
