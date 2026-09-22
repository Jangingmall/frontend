"use client";
import { useRouter } from "next/navigation";

import { isPaidOrder } from "@/app/(protected)/checkout/_lib/checkout-session";
import { usePaymentOrderQuery } from "@/queries/payments";
import { useAuthStore } from "@/stores/auth";

import { OrderCompletePage } from "./OrderCompletePage";
export function RealOrderComplete({ orderId }: { orderId: number }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const order = usePaymentOrderQuery(
    orderId,
    `member-${user?.id ?? "current"}`,
  );
  const loading = order.isPending || order.isFetching;
  const paid =
    !loading && !order.isError && order.data && isPaidOrder(order.data.status);
  return (
    <OrderCompletePage
      outcome="success"
      orderNumber={order.data?.orderNumber ?? ""}
      totalAmount={order.data?.totalAmount ?? 0}
      verification={
        paid
          ? undefined
          : {
              message: loading
                ? "주문 상태를 확인하고 있습니다"
                : order.isError
                  ? "주문 정보를 확인하지 못했습니다"
                  : "결제 완료가 확인되지 않았습니다",
              description: loading
                ? "결제 결과를 확인 중입니다. 잠시만 기다려 주세요."
                : order.isError
                  ? "주문 정보를 불러오지 못했습니다. 다시 확인하거나 주문 내역을 확인해 주세요."
                  : "결제가 완료되지 않았거나 결과 확인이 필요합니다. 주문 내역에서 상태를 확인해 주세요.",
              loading,
              error: order.isError,
              onRetry: () => void order.refetch(),
            }
      }
      onViewOrders={() => router.push("/mypage/orders")}
      onContinueBrowsing={() => router.push("/")}
    />
  );
}
