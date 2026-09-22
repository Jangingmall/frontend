export const paymentKeys = {
  all: ["payments"] as const,
  order: (identity: string, id: number) =>
    ["payments", identity, "order", id] as const,
};
