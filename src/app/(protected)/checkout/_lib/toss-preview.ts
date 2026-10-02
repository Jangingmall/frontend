import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";

// 토스 공식 일반 결제창 샘플의 공개 테스트 키. 시연 주문에서만 사용한다.
// https://github.com/tosspayments/tosspayments-sample/blob/main/express-javascript/public/payment/checkout.html
const clientKey = "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";
export async function openPreviewPayment(
  input: {
    amount: number;
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
    method: "CARD" | "TRANSFER" | "TOSSPAY";
  },
  signal?: AbortSignal,
) {
  const toss = await loadTossPayments(clientKey);
  if (signal?.aborted) return;
  const payment = toss.payment({ customerKey: ANONYMOUS });
  const common = {
    amount: { currency: "KRW" as const, value: input.amount },
    orderId: input.orderId,
    orderName: input.orderName,
    successUrl: input.successUrl,
    failUrl: input.failUrl,
  };
  if (input.method === "TRANSFER") {
    await payment.requestPayment({ ...common, method: "TRANSFER" });
  } else {
    await payment.requestPayment({
      ...common,
      method: "CARD",
      card:
        input.method === "TOSSPAY"
          ? { flowMode: "DIRECT", easyPay: "토스페이" }
          : { flowMode: "DEFAULT" },
    });
  }
}
