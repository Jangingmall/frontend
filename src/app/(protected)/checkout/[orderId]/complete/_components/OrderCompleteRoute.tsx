"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Toast } from "@/components/ui/toast";
import { publicEnv } from "@/lib/env";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";

import type { OrderCompleteOutcome } from "./order-complete-state";
import { OrderCompletePage } from "./OrderCompletePage";

interface OrderCompleteRouteProps {
  outcome: OrderCompleteOutcome;
}

export function OrderCompleteRoute({ outcome }: OrderCompleteRouteProps) {
  const router = useRouter();
  const [showOrdersNotice, setShowOrdersNotice] = useState(false);
  const checkoutTotal = usePurchasePreviewStore((state) => state.checkoutTotal);
  const totalAmount = usePurchasePreviewStore((state) =>
    state.checkoutLines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    ),
  );

  useEffect(() => {
    if (!showOrdersNotice) return;
    const timeout = window.setTimeout(() => setShowOrdersNotice(false), 6000);
    return () => window.clearTimeout(timeout);
  }, [showOrdersNotice]);

  return (
    <>
      <p role="status" className="p-3 text-center text-body-s">
        주문·결제 시연 완료 · 실제 주문, 결제, 입금 계좌가 생성되지 않습니다.
      </p>
      <OrderCompletePage
        outcome={outcome}
        totalAmount={checkoutTotal ?? (totalAmount || undefined)}
        onViewOrders={() => {
          if (publicEnv.apiMocking) setShowOrdersNotice(true);
          else router.push("/mypage/orders");
        }}
        onContinueBrowsing={() => router.push("/")}
      />
      {showOrdersNotice ? (
        <div className="fixed inset-x-4 bottom-6 z-80 flex justify-center">
          <Toast className="h-auto min-h-11.5 bg-bg-deam py-3 [&>span]:px-4">
            시연 주문은 실제 주문 내역에 저장되지 않습니다.
          </Toast>
        </div>
      ) : null}
    </>
  );
}
