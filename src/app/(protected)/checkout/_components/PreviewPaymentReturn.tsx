"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { previewLinesSchema } from "@/api/purchase-preview/validation";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";

/** 테스트 결제창 인증 이후의 시연 복귀. 실제 결제 승인 API는 호출하지 않는다. */
export function PreviewPaymentReturn({
  result,
  orderId,
  amount,
  paymentKey,
}: {
  result: string;
  orderId?: string;
  amount?: string;
  paymentKey?: string;
}) {
  const router = useRouter();
  useEffect(() => {
    if (result !== "success" || !paymentKey || !orderId?.startsWith("demo-"))
      return;
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("preview-payment") ?? "null",
      );
      if (
        !saved ||
        saved.orderId !== orderId ||
        saved.amount !== Number(amount)
      )
        return;
      const lines = previewLinesSchema.parse(saved.lines);
      usePurchasePreviewStore.getState().beginCheckout(lines);
      usePurchasePreviewStore.getState().setCheckoutTotal(saved.amount);
      sessionStorage.removeItem("preview-payment");
      router.replace("/checkout/ui-preview-order/complete?result=success");
    } catch {
      /* 복원할 수 없는 결제는 완료 처리하지 않는다. */
    }
  }, [result, orderId, amount, paymentKey, router]);
  return (
    <section className="mx-auto max-w-xl space-y-4 p-12 text-center">
      <h1 className="text-title-l">
        {result === "fail"
          ? "결제가 취소되었거나 실패했습니다."
          : "시연 결제 정보를 확인하고 있습니다."}
      </h1>
      <p>완료 화면으로 이동하지 않으면 주문서에서 다시 시도해 주세요.</p>
      <Link href="/checkout/ui-preview-order" className="underline">
        주문서로 돌아가기
      </Link>
    </section>
  );
}
