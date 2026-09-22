"use client";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import { publicEnv } from "@/lib/env";
import { useAuthStore } from "@/stores/auth";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";
import { PURCHASE_PREVIEW_ORDER_ID } from "@/types/purchase-preview";

import { CartPage } from "./CartPage";
export function CartRoute() {
  const router = useRouter();
  const authenticated = useAuthStore(
    (state) => state.status === "authenticated",
  );
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const initialLines = usePurchasePreviewStore((state) => state.lines);
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
      key={userId ?? "anonymous"}
      initialLines={initialLines}
      authenticated={authenticated}
      onLinesChange={setLines}
      onCheckout={(lines) => {
        beginCheckout(lines);
        router.push(`/checkout/${PURCHASE_PREVIEW_ORDER_ID}` as Route);
      }}
      onEditOptions={(path) => router.push(path as Route)}
      onLogin={() => router.push("/login?returnUrl=%2Fcart")}
      onHome={() => router.push("/")}
    />
  );
}
