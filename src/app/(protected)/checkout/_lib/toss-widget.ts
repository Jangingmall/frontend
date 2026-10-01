import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";

interface WidgetCheckoutInput {
  clientKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  method: "CARD" | "TRANSFER" | "TOSSPAY";
}
const labels = {
  CARD: "신용·체크카드",
  TRANSFER: "실시간 계좌이체",
  TOSSPAY: "토스페이",
};
const canceled = () =>
  new Error("결제를 취소했습니다. 다시 시도할 수 있습니다.");

// 토스 결제창에서 수단을 다시 선택하므로 서버에 준비한 수단과 일치할 때만 요청한다.
export async function openTossWidget(
  input: WidgetCheckoutInput,
  signal?: AbortSignal,
) {
  if (!/^(test|live)_gck_\S+$/.test(input.clientKey)) {
    throw new Error(
      "결제 서비스 키 설정을 확인해 주세요. 주문서형·결제창형 클라이언트 키가 필요합니다.",
    );
  }
  if (signal?.aborted) throw canceled();
  const toss = await loadTossPayments(input.clientKey);
  if (signal?.aborted) throw canceled();
  const widgets = toss.widgets({ customerKey: ANONYMOUS });
  await widgets.setAmount({ currency: "KRW", value: input.amount });
  if (signal?.aborted) throw canceled();
  const paymentWindow = await widgets.renderPaymentWindow();
  let abort: (() => void) | undefined;
  try {
    if (signal?.aborted) throw canceled();
    await new Promise<void>((resolve, reject) => {
      let finished = false;
      let requesting = false;
      const fail = (error: unknown) => {
        if (finished) return;
        finished = true;
        reject(error);
      };
      abort = () => fail(canceled());
      signal?.addEventListener("abort", abort, { once: true });
      paymentWindow.on("cancel", async () => fail(canceled()));
      paymentWindow.on("paymentRequest", async ({ paymentMethod }) => {
        if (finished || requesting) return;
        if (paymentMethod.code !== input.method) {
          fail(
            new Error(
              "주문서에서 선택한 " +
                labels[input.method] +
                "로 결제해 주세요. 다른 수단은 주문서에서 변경한 뒤 다시 시도해 주세요.",
            ),
          );
          return;
        }
        requesting = true;
        try {
          await widgets.requestPayment({
            orderId: input.orderId,
            orderName: input.orderName,
            successUrl: input.successUrl,
            failUrl: input.failUrl,
          });
          if (!finished) {
            finished = true;
            resolve();
          }
        } catch (error) {
          fail(error);
        }
      });
    });
  } finally {
    if (abort) signal?.removeEventListener("abort", abort);
    // 사용자가 닫은 창은 이미 제거됐을 수 있어 원래 결제 결과를 유지한다.
    await paymentWindow.destroy().catch(() => undefined);
  }
}
