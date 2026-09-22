export const cartKeys = {
  all: ["cart"] as const,
  detail: (identity: string) => ["cart", identity] as const,
};
