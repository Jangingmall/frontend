export const recentViewKeys = {
  all: ["recentViews"] as const,
  list: (page: number) => [...recentViewKeys.all, "list", page] as const,
};
