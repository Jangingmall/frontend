"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cartFixtures } from "@/app/cart/_lib/cart-fixtures";
import { publicEnv } from "@/lib/env";
import { useAuthStore } from "@/stores/auth";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";

import { CartPage } from "./CartPage";
import { LiveCartRoute } from "./LiveCartRoute";
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
  if (!publicEnv.apiMocking) return <LiveCartRoute />;
  return (
    <CartPage
      initialLines={initialLines}
      authenticated={authenticated}
      onLinesChange={(lines) => {
        previewStarted = true;
        setLines(lines);
      }}
      onLogin={() => router.push("/login?returnUrl=%2Fcart")}
      onHome={() => router.push("/")}
    />
  );
}
