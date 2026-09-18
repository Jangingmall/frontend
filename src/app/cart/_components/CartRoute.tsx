"use client";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cartFixtures } from "@/app/cart/_lib/cart-fixtures";
import { publicEnv } from "@/lib/env";
import { useAuthStore } from "@/stores/auth";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";
import { PURCHASE_PREVIEW_ORDER_ID } from "@/types/purchase-preview";

import { CartPage } from "./CartPage";
// 같은 브라우저 세션에서 마지막 항목을 삭제한 뒤 돌아와도 샘플을 재생성하지 않는다.
let previewStarted = false;
export function CartRoute() {
  const router = useRouter();
  const authenticated = useAuthStore(
    (state) => state.status === "authenticated",
  );
  const [initialLines] = useState(() =>
    previewStarted
      ? usePurchasePreviewStore.getState().lines
      : cartFixtures.base,
  );
  const setLines = usePurchasePreviewStore((state) => state.setLines);
  const beginCheckout = usePurchasePreviewStore((state) => state.beginCheckout);
  if (!publicEnv.apiMocking)
    return (
      <div className="flex-1 bg-bg-subtle px-6 py-16 text-center">
        <h1 className="text-title-xl">장바구니</h1>
        <p className="mt-12 text-body-l">장바구니 기능은 준비 중입니다.</p>
      </div>
    );
  return (
    <CartPage
      initialLines={initialLines}
      authenticated={authenticated}
      onLinesChange={(lines) => {
        previewStarted = true;
        setLines(lines);
      }}
      onCheckout={(lines) => {
        beginCheckout(lines);
        router.push(`/checkout/${PURCHASE_PREVIEW_ORDER_ID}` as Route);
      }}
      onLogin={() => router.push("/login?returnUrl=%2Fcart")}
      onHome={() => router.push("/")}
    />
  );
}
