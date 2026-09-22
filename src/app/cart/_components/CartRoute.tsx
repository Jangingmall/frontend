"use client";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import { publicEnv } from "@/lib/env";
import { useAuthStore } from "@/stores/auth";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";
import { PURCHASE_PREVIEW_ORDER_ID } from "@/types/purchase-preview";

import { CartPage } from "./CartPage";
import { LiveCartRoute } from "./LiveCartRoute";

export function CartRoute() {
  const router = useRouter();
  const authenticated = useAuthStore(
    (state) => state.status === "authenticated",
  );
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const initialLines = usePurchasePreviewStore((state) => state.lines);
  const setLines = usePurchasePreviewStore((state) => state.setLines);
  const beginCheckout = usePurchasePreviewStore((state) => state.beginCheckout);
  if (!publicEnv.apiMocking) return <LiveCartRoute />;
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
