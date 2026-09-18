"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Toast } from "@/components/ui/toast";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";

import type { OrderCompleteOutcome } from "./order-complete-state";
import { OrderCompletePage } from "./OrderCompletePage";

interface OrderCompleteRouteProps {
  outcome: OrderCompleteOutcome;
}

export function OrderCompleteRoute({ outcome }: OrderCompleteRouteProps) {
  const router = useRouter();
  const [showOrdersNotice, setShowOrdersNotice] = useState(false);
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
      <OrderCompletePage
        outcome={outcome}
        totalAmount={totalAmount || undefined}
        onViewOrders={() => setShowOrdersNotice(true)}
        onContinueBrowsing={() => router.push("/")}
      />
      {showOrdersNotice ? (
        <div className="fixed inset-x-4 bottom-6 z-80 flex justify-center">
          <Toast className="h-auto min-h-11.5 bg-bg-deam py-3 [&>span]:px-4">
            주문 내역은 준비 중입니다.
          </Toast>
        </div>
      ) : null}
    </>
  );
}
