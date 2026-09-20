"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PaymentFeedbackDialog } from "@/app/(protected)/checkout/_components/PaymentFeedbackDialog";
import {
  clearOrderRequestKey,
  readPaymentContext,
  validatePaymentCallback,
} from "@/app/(protected)/checkout/_lib/checkout-session";
import { getPaymentErrorMessage } from "@/app/(protected)/checkout/_lib/payment-error";
import { PurchaseStepIndicator } from "@/components/order/PurchaseStepIndicator";
import { Button } from "@/components/ui/button";
import {
  useConfirmPaymentMutation,
  useFailPaymentMutation,
} from "@/queries/payments";
export function PaymentCallback({ failure = false }: { failure?: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const confirm = useConfirmPaymentMutation();
  const fail = useFailPaymentMutation();
  const started = useRef(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const confirmPayment = confirm.mutateAsync;
  const failPayment = fail.mutateAsync;
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function run() {
      try {
        const saved = readPaymentContext(params.get("orderId") ?? "");
        if (failure) {
          if (!saved)
            throw new Error(
              "결제 요청을 확인할 수 없습니다. 주문 내역을 확인해 주세요.",
            );
          await failPayment({
            orderId: saved.orderNumber,
            errorCode: (params.get("code") || "PAYMENT_FAILED").slice(0, 100),
            errorMessage: (
              params.get("message") || "결제가 취소되었습니다."
            ).slice(0, 255),
          });
          if (saved.requestKey) clearOrderRequestKey(saved.requestKey);
          setError(params.get("message") || "결제가 취소되었습니다.");
          return;
        }
        const input = validatePaymentCallback(
          new URLSearchParams(params.toString()),
          saved,
        );
        const result = await confirmPayment(input);
        if (
          result.orderId !== saved!.orderId ||
          result.orderNumber !== saved!.orderNumber ||
          result.amount !== saved!.amount ||
          result.status !== "DONE"
        )
          throw new Error(
            "결제 승인 결과를 확인할 수 없습니다. 주문 내역을 확인해 주세요.",
          );
        router.replace(`/checkout/${result.orderId}/complete`);
      } catch (cause) {
        setError(getPaymentErrorMessage(cause));
      }
    }
    void run();
  }, [params, router, failure, confirmPayment, failPayment, retry]);
  return (
    <main className="mx-auto w-full max-w-[936px] space-y-6 px-6 pt-16 pb-[200px]">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-title-xl">주문 결제</h1>
        <PurchaseStepIndicator current={2} />
      </header>
      <h2 className="text-title-l">
        {failure ? "결제를 완료하지 못했습니다" : "결제 승인 확인"}
      </h2>
      {error ? (
        <>
          <p role="alert">{error}</p>
          {!failure && (
            <Button
              onClick={() => {
                started.current = false;
                setError("");
                setRetry((value) => value + 1);
              }}
            >
              승인 결과 다시 확인
            </Button>
          )}
        </>
      ) : (
        <p role="status">결제 결과를 확인하고 있습니다.</p>
      )}
      <Link href="/mypage/orders">주문 내역 확인</Link>
      <br />
      <Link href="/cart">장바구니로 이동</Link>
      <PaymentFeedbackDialog
        outcome={
          failure && error
            ? (params.get("code") ?? "").includes("CANCEL")
              ? "cancelled"
              : (params.get("code") ?? "").includes("TIMEOUT")
                ? "timeout"
                : "declined"
            : null
        }
        message={error}
        onClose={() => router.push("/cart")}
        onCart={() => router.push("/cart")}
      />
    </main>
  );
}
