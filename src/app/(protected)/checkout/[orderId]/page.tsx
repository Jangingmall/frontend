import { Suspense } from "react";

import { CheckoutEntry } from "@/app/(protected)/checkout/_components/CheckoutEntry";
interface CheckoutRouteProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{
    paymentResult?: string;
    orderId?: string;
    amount?: string;
    paymentKey?: string;
  }>;
}
export default async function Page({
  params,
  searchParams,
}: CheckoutRouteProps) {
  const { orderId } = await params;
  const query = await searchParams;
  return (
    <Suspense fallback={<p>주문 정보를 불러오는 중입니다.</p>}>
      <CheckoutEntry
        orderId={orderId}
        paymentResult={query.paymentResult}
        paymentOrderId={query.orderId}
        paymentAmount={query.amount}
        paymentKey={query.paymentKey}
      />
    </Suspense>
  );
}
