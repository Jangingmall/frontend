export type PaymentMethod = "CARD" | "TRANSFER" | "EASY_PAY";
export interface CreateOrderInput {
  cartItemIds: number[];
  addressId: number;
  deliveryRequest: string;
  paymentMethod: PaymentMethod;
}
export interface PaymentContext {
  requestKey?: string;
  orderId: number;
  orderNumber: string;
  amount: number;
}
