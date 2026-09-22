import { Suspense } from "react";

import { CheckoutEntry } from "@/app/(protected)/checkout/_components/CheckoutEntry";
interface CheckoutRouteProps {
  params: Promise<{ orderId: string }>;
}
export default async function Page({ params }: CheckoutRouteProps) {
  const { orderId } = await params;
  return (
    <Suspense fallback={<p>주문 정보를 불러오는 중입니다.</p>}>
      <CheckoutEntry orderId={orderId} />
    </Suspense>
  );
}
