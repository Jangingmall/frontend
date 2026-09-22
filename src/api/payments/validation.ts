import { z } from "zod";
export const orderSchema = z
  .object({
    orderId: z.number().int().positive(),
    orderNumber: z.string().min(6),
    totalAmount: z.number().int().nonnegative(),
    status: z.string(),
    createdAt: z.string(),
  })
  .passthrough();
export const preparedSchema = z
  .object({
    paymentId: z.number().int().positive(),
    orderId: z.number().int().positive(),
    amount: z.number().int().positive(),
    tossClientKey: z.string(),
    created: z.boolean(),
  })
  .passthrough();
export const paymentSchema = z
  .object({
    paymentId: z.number().int().positive(),
    orderId: z.number().int().positive(),
    orderNumber: z.string(),
    amount: z.number().int().positive(),
    status: z.string(),
  })
  .passthrough();

export type OrderDto = z.infer<typeof orderSchema>;
export type PreparedPaymentDto = z.infer<typeof preparedSchema>;
export type PaymentDto = z.infer<typeof paymentSchema>;
