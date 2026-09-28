import { z } from "zod";

import { clientFetch } from "@/lib/http/client";
import type {
  CartPreviewLine,
  PreviewPaymentOutcome,
} from "@/types/purchase-preview";

import type { BenefitInput } from "./benefits";
import { previewLinesSchema } from "./validation";
export async function savePreviewCart(lines: CartPreviewLine[]) {
  return previewLinesSchema.parse(
    await clientFetch("/api/mock/purchase/cart", {
      method: "PUT",
      body: { lines },
    }),
  );
}
export async function fetchPreviewCart() {
  return previewLinesSchema.parse(await clientFetch("/api/mock/purchase/cart"));
}
export async function submitPreviewOrder(
  lines: CartPreviewLine[],
  outcome: PreviewPaymentOutcome,
  benefits?: BenefitInput,
) {
  return z
    .object({
      total: z.number().nonnegative(),
      outcome: z.enum([
        "success",
        "bank-pending",
        "declined",
        "timeout",
        "cancelled",
      ]),
    })
    .parse(
      await clientFetch("/api/mock/purchase/orders", {
        method: "POST",
        body: { lines, outcome, benefits },
      }),
    );
}

export async function requestPreviewCancel(
  orderId: number,
  reason: string,
  photos: File[],
) {
  await clientFetch(`/api/mock/orders/${orderId}/cancel-request`, {
    method: "POST",
    body: {
      reason,
      photos: photos.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    },
  });
}
