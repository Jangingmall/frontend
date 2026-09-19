"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { isPaidOrder } from "@/app/(protected)/checkout/_lib/checkout-session";
import { Button } from "@/components/ui/button";
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
  if (order.isPending || order.isFetching)
    return (
      <p role="status" className="p-16">
        주문 상태를 확인하고 있습니다.
      </p>
    );
  if (order.isError)
    return (
      <div className="p-16">
        <p role="alert">주문 정보를 확인하지 못했습니다.</p>
        <Button onClick={() => void order.refetch()}>다시 확인</Button>
        <Link href="/mypage/orders">주문 내역</Link>
      </div>
    );
  const paid = isPaidOrder(order.data.status);
  if (paid)
    return (
      <OrderCompletePage
        outcome="success"
        orderNumber={order.data.orderNumber}
        totalAmount={order.data.totalAmount}
        onViewOrders={() => router.push("/mypage/orders")}
        onContinueBrowsing={() => router.push("/")}
      />
    );
  return (
    <main className="mx-auto max-w-xl space-y-6 px-6 py-24">
      <h1 className="text-title-xl">
        {paid ? "주문이 완료되었습니다" : "결제 완료가 확인되지 않았습니다"}
      </h1>
      <p>주문번호: {order.data.orderNumber}</p>
      <p>주문 금액: {order.data.totalAmount.toLocaleString("ko-KR")}원</p>
      {!paid && (
        <>
          <p>
            주문 상태: {order.data.status}. 결제 여부는 주문 내역에서 확인해
            주세요.
          </p>
          <Button onClick={() => void order.refetch()}>
            주문 상태 다시 확인
          </Button>
        </>
      )}
      <Link href="/mypage/orders">주문 내역 보기</Link>
      <br />
      <Link href="/">쇼핑 계속하기</Link>
    </main>
  );
}
