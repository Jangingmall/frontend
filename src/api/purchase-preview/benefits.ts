import { z } from "zod";

import { clientFetch } from "@/lib/http/client";

import { type BenefitInput, benefitResult } from "./benefit-contract";
export type { BenefitInput } from "./benefit-contract";
export async function fetchPreviewBenefits() {
  return z
    .object({
      points: z.number(),
      code: z.string(),
      coupons: z.array(z.object({ id: z.string(), name: z.string() })),
    })
    .parse(await clientFetch("/api/mock/purchase/benefits"));
}
export async function applyPreviewBenefits(input: BenefitInput) {
  return benefitResult.parse(
    await clientFetch("/api/mock/purchase/benefits/apply", {
      method: "POST",
      body: input,
    }),
  );
}
