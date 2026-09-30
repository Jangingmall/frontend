"use client";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { savePreviewCart } from "@/api/purchase-preview/api";
import { useMockAccount } from "@/lib/demo-session";
import { useAuthStore } from "@/stores/auth";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";
import { PURCHASE_PREVIEW_ORDER_ID } from "@/types/purchase-preview";

import { CartPage } from "./CartPage";
import { LiveCartRoute } from "./LiveCartRoute";

export function CartRoute() {
  const router = useRouter();
  const mockAccount = useMockAccount();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const authenticated = useAuthStore(
    (state) => state.status === "authenticated",
  );
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const initialLines = usePurchasePreviewStore((state) => state.lines);
  const setLines = usePurchasePreviewStore((state) => state.setLines);
  const beginCheckout = usePurchasePreviewStore((state) => state.beginCheckout);
  const syncLines = useCallback(
    (lines: Parameters<typeof savePreviewCart>[0]) => {
      void savePreviewCart(lines)
        .then((saved) => {
          if ((useAuthStore.getState().user?.id ?? null) === userId)
            setLines(saved);
        })
        .catch(() => setError("시연 장바구니를 저장하지 못했습니다."));
    },
    [setLines, userId],
  );
  if (!mockAccount && search.get("preview") !== "1") return <LiveCartRoute />;
  return (
    <>
      {search.get("preview") === "1" && (
        <p role="status" className="p-3 text-center">
          시연 장바구니 · 변경 사항과 결제는 실제 서버에 반영되지 않습니다.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <CartPage
        key={userId ?? "anonymous"}
        initialLines={initialLines}
        authenticated={authenticated}
        onLinesChange={syncLines}
        onCheckout={(lines) => {
          beginCheckout(lines);
          router.push(`/checkout/${PURCHASE_PREVIEW_ORDER_ID}` as Route);
        }}
        onEditOptions={(path) => router.push(path as Route)}
        onLogin={() => router.push("/login?returnUrl=%2Fcart")}
        onHome={() => router.push("/")}
      />
    </>
  );
}
