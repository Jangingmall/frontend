import { http } from "msw";
import { z } from "zod";

import { productCartInput } from "@/api/products/detail-actions-validation";
import {
  benefitInput,
  calculateBenefits,
  demoBenefits,
} from "@/api/purchase-preview/benefit-contract";
import { previewLinesSchema } from "@/api/purchase-preview/validation";
import { ARTISAN_CAROUSEL_ITEMS } from "@/app/_lib/artisan-carousel-fixtures";

import { mockError, mockOk } from "./envelope";
const restock = new Set<string>();
const wishes = new Set<string>();
const carts = new Map<string, z.infer<typeof previewLinesSchema>>();
export const extensionHandlers = [
  http.post(
    "*/api/mock/orders/:orderId/cancel-request",
    async ({ request, params }): Promise<Response> => {
      const input = z
        .object({
          reason: z.string().min(1),
          photos: z.array(
            z.object({ name: z.string(), type: z.string(), size: z.number() }),
          ),
        })
        .safeParse(await request.json());
      if (!input.success) return mockError(400, "INVALID_INPUT");
      return mockOk(
        { orderId: Number(params.orderId), status: "DEMO_REQUESTED" },
        201,
      );
    },
  ),
  http.get("*/api/mock/purchase/benefits", () => mockOk(demoBenefits)),
  http.post(
    "*/api/mock/purchase/benefits/apply",
    async ({ request }): Promise<Response> => {
      const input = benefitInput.safeParse(await request.json());
      if (
        !input.success ||
        (input.data.code && input.data.code !== demoBenefits.code)
      )
        return mockError(400, "INVALID_INPUT");
      return mockOk(calculateBenefits(input.data));
    },
  ),
  http.get("*/api/mock/home/artisans", () => mockOk(ARTISAN_CAROUSEL_ITEMS)),
  http.get("*/api/mock/products/:productId/actions", ({ request, params }) => {
    const key = `${request.headers.get("X-Demo-Viewer")}:${params.productId}`;
    return mockOk({
      wished: wishes.has(key),
      restockRequested: restock.has(key),
    });
  }),
  http.patch(
    "*/api/mock/products/:productId/actions",
    async ({ request, params }): Promise<Response> => {
      const viewer = request.headers.get("X-Demo-Viewer");
      if (!viewer) return mockError(401, "UNAUTHORIZED");
      const input = z
        .object({ wished: z.boolean() })
        .safeParse(await request.json());
      if (!input.success) return mockError(400, "INVALID_INPUT");
      const key = `${viewer}:${params.productId}`;
      if (input.data.wished) wishes.add(key);
      else wishes.delete(key);
      return mockOk({
        wished: wishes.has(key),
        restockRequested: restock.has(key),
      });
    },
  ),
  http.post(
    "*/api/mock/products/:productId/cart-selections",
    async ({ request }): Promise<Response> => {
      const input = productCartInput.safeParse(await request.json());
      if (!input.success) return mockError(400, "INVALID_INPUT");
      return mockOk({ duplicate: false });
    },
  ),
  http.get("*/api/mock/purchase/cart", ({ request }) =>
    mockOk(carts.get(request.headers.get("X-Demo-Viewer") ?? "guest") ?? []),
  ),
  http.put(
    "*/api/mock/purchase/cart",
    async ({ request }): Promise<Response> => {
      const parsed = z
        .object({ lines: previewLinesSchema })
        .safeParse(await request.json());
      if (!parsed.success) return mockError(400, "INVALID_INPUT");
      carts.set(
        request.headers.get("X-Demo-Viewer") ?? "guest",
        parsed.data.lines,
      );
      return mockOk(parsed.data.lines);
    },
  ),
  http.post(
    "*/api/mock/purchase/orders",
    async ({ request }): Promise<Response> => {
      const parsed = z
        .object({
          lines: previewLinesSchema.min(1),
          outcome: z.enum([
            "success",
            "bank-pending",
            "declined",
            "timeout",
            "cancelled",
          ]),
          benefits: benefitInput.optional(),
        })
        .safeParse(await request.json());
      if (!parsed.success) return mockError(400, "INVALID_INPUT");
      if (
        parsed.data.lines.some(
          (line) => line.soldOut || line.quantity > line.maxQuantity,
        )
      )
        return mockError(409, "CONFLICT");
      const subtotal = parsed.data.lines.reduce(
        (sum, line) => sum + line.quantity * line.unitPrice,
        0,
      );
      if (
        parsed.data.benefits?.code &&
        parsed.data.benefits.code !== demoBenefits.code
      )
        return mockError(400, "INVALID_INPUT");
      const amount = calculateBenefits({
        ...benefitInput.parse(parsed.data.benefits ?? { subtotal }),
        subtotal,
      });
      return mockOk({ outcome: parsed.data.outcome, ...amount }, 201);
    },
  ),
  http.get(
    "*/api/mock/products/:productId/restock",
    ({ request, params }): Response => {
      const viewer = request.headers.get("X-Demo-Viewer");
      if (!viewer) return mockError(401, "UNAUTHORIZED");
      return mockOk({
        restockRequested: restock.has(`${viewer}:${params.productId}`),
      });
    },
  ),
  http.post(
    "*/api/mock/products/:productId/restock",
    ({ request, params }): Response => {
      const viewer = request.headers.get("X-Demo-Viewer");
      if (!viewer) return mockError(401, "UNAUTHORIZED");
      const key = `${viewer}:${params.productId}`;
      const duplicate = restock.has(key);
      restock.add(key);
      return mockOk({ duplicate });
    },
  ),
];
