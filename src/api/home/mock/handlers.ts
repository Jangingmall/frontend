import { http } from "msw";

import { mockOk } from "@/mocks/envelope";

import { HOME_BEST_PRODUCTS, HOME_PROMOTION_PRODUCTS } from "./fixtures";

export const homeHandlers = [
  http.get("*/api/mock/home/best", () => mockOk(HOME_BEST_PRODUCTS)),
  http.get("*/api/mock/home/promotions", () => mockOk(HOME_PROMOTION_PRODUCTS)),
];
