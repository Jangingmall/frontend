import { z } from "zod";
export const benefitInput = z.object({
  subtotal: z.number().int().nonnegative(),
  code: z.string().default(""),
  points: z.number().int().min(0).max(3000).default(0),
  coupon: z.enum(["none", "welcome"]).default("none"),
});
export type BenefitInput = z.input<typeof benefitInput>;
export const benefitResult = z.object({
  discount: z.number().nonnegative(),
  total: z.number().nonnegative(),
});
export const demoBenefits = {
  points: 3000,
  code: "MIDAM10",
  coupons: [{ id: "welcome", name: "시연 환영 쿠폰 2,000원" }],
};
export function calculateBenefits(input: z.infer<typeof benefitInput>) {
  const discount = Math.min(
    input.subtotal,
    input.points +
      (input.coupon === "welcome" ? 2000 : 0) +
      (input.code === "MIDAM10" ? Math.floor(input.subtotal * 0.1) : 0),
  );
  return { discount, total: input.subtotal - discount };
}
