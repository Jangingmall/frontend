import { Suspense } from "react";

import { PaymentCallback } from "@/app/(protected)/payments/_components/PaymentCallback";
export default function Page() {
  return (
    <Suspense fallback={<p>결제 확인 중…</p>}>
      <PaymentCallback failure />
    </Suspense>
  );
}
