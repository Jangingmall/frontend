import {
  type OrdersListQuery,
  toOrdersListSearchParams,
} from "@/api/orders/query";

export const orderKeys = {
  all: ["orders"] as const,
  list: (query: OrdersListQuery) =>
    ["orders", "list", toOrdersListSearchParams(query).toString()] as const,
  statusSummary: ["orders", "status-summary"] as const,
};
