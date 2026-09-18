"use client";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import { CHECKOUT_PREVIEW_LINES } from "@/app/(protected)/checkout/_lib/checkout-fixtures";
import { publicEnv } from "@/lib/env";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";
import { PURCHASE_PREVIEW_ORDER_ID } from "@/types/purchase-preview";

import { CheckoutPage } from "./CheckoutPage";
import type { PaymentFailure } from "./PaymentFeedbackDialog";
export function CheckoutEntry({
  orderId,
  initialFeedback,
}: {
  orderId: string;
  initialFeedback?: PaymentFailure;
}) {
  const router = useRouter();
  const snapshot = usePurchasePreviewStore((state) => state.checkoutLines);
  const beginCheckout = usePurchasePreviewStore((state) => state.beginCheckout);
  if (!publicEnv.apiMocking || orderId !== PURCHASE_PREVIEW_ORDER_ID)
    return (
      <div className="mx-auto py-32 text-center">
        <h1 className="text-title-l">주문 결제를 준비 중입니다.</h1>
        <p className="mt-3 text-body-m">주문 정보를 확인할 수 없습니다.</p>
      </div>
    );
  const lines = snapshot.length ? snapshot : CHECKOUT_PREVIEW_LINES;
  return (
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
  );
}
