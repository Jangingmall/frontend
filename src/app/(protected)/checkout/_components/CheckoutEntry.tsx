"use client";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import { CHECKOUT_PREVIEW_LINES } from "@/app/(protected)/checkout/_lib/checkout-fixtures";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";
import { PURCHASE_PREVIEW_ORDER_ID } from "@/types/purchase-preview";

import { PreviewPaymentReturn } from "./PreviewPaymentReturn";
import { CheckoutPage } from "./CheckoutPage";
import type { PaymentFailure } from "./PaymentFeedbackDialog";
import { RealCheckoutPage } from "./RealCheckoutPage";
interface CheckoutEntryProps {
  orderId: string;
  initialFeedback?: PaymentFailure;
  paymentResult?: string;
  paymentOrderId?: string;
  paymentAmount?: string;
  paymentKey?: string;
}
export function CheckoutEntry({
  orderId,
  initialFeedback,
  paymentResult,
  paymentOrderId,
  paymentAmount,
  paymentKey,
}: CheckoutEntryProps) {
  const router = useRouter();
  const snapshot = usePurchasePreviewStore((state) => state.checkoutLines);
  const beginCheckout = usePurchasePreviewStore((state) => state.beginCheckout);
  if (orderId === "new") return <RealCheckoutPage />;
  if (orderId !== PURCHASE_PREVIEW_ORDER_ID)
    return <RealCheckoutPage allowOrder={false} />;
  if (paymentResult)
    return (
      <PreviewPaymentReturn
        result={paymentResult}
        orderId={paymentOrderId}
        amount={paymentAmount}
        paymentKey={paymentKey}
      />
    );
  const lines = snapshot.length ? snapshot : CHECKOUT_PREVIEW_LINES;
  return (
    <>
      <p role="status" className="p-3 text-center text-body-s">
        주문·결제 시연 · 실제 결제되지 않습니다.
      </p>
      <CheckoutPage
        lines={lines}
        initialFeedback={initialFeedback}
        onCart={() => router.push("/cart" as Route)}
        onComplete={(result) => {
          beginCheckout(lines);
          router.push(
            `/checkout/${PURCHASE_PREVIEW_ORDER_ID}/complete?result=${result}` as Route,
          );
        }}
      />
    </>
  );
}
