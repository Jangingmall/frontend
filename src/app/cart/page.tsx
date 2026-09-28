import { Suspense } from "react";

import { CartRoute } from "./_components/CartRoute";
export const metadata = { title: "장바구니 | 미담" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8 text-center">
          장바구니를 불러오는 중입니다…
        </p>
      }
    >
      <CartRoute />
    </Suspense>
  );
}
