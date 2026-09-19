"use client";
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

import {
  clearOrderRequestKey,
  getOrderRequestKey,
  parseCartItemIds,
  savePaymentContext,
} from "@/app/(protected)/checkout/_lib/checkout-session";
import { getPaymentErrorMessage } from "@/app/(protected)/checkout/_lib/payment-error";
import { AddressFormModal } from "@/components/member/AddressFormModal";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PaymentsMethod } from "@/components/order/PaymentsMethod";
import { PurchaseStepIndicator } from "@/components/order/PurchaseStepIndicator";
import { Button } from "@/components/ui/button";
import { useCartQuery } from "@/queries/cart";
import { useCreateAddressMutation } from "@/queries/member/mutations";
import { useAddressesQuery } from "@/queries/member/queries";
import {
  useCreateOrderMutation,
  usePreparePaymentMutation,
} from "@/queries/payments";
import { useAuthStore } from "@/stores/auth";
import { getCartShippingAmount } from "@/types/cart";
import type { CreateOrderInput } from "@/types/payment";
import type { PreviewPaymentMethod } from "@/types/purchase-preview";

import { CheckoutProducts } from "./CheckoutProducts";
export function RealCheckoutPage() {
  const params = useSearchParams();
  const ids = parseCartItemIds(params.get("items"));
  const user = useAuthStore((state) => state.user);
  const cart = useCartQuery(true, `member-${user?.id ?? "current"}`);
  const addresses = useAddressesQuery(user?.id);
  const createAddress = useCreateAddressMutation();
  const create = useCreateOrderMutation();
  const prepare = usePreparePaymentMutation();
  const [addressId, setAddressId] = useState<number>();
  const [method, setMethod] = useState<PreviewPaymentMethod>();
  const [memo, setMemo] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [revisedOrder, setRevisedOrder] = useState<{
    key: string;
    amount: number;
  } | null>(null);
  if (cart.isPending || addresses.isPending)
    return (
      <p role="status" className="p-16">
        주문 정보를 불러오는 중입니다.
      </p>
    );
  if (cart.isError || addresses.isError)
    return (
      <div className="p-16">
        <p role="alert">주문 정보를 불러오지 못했습니다.</p>
        <Button
          onClick={() => {
            void cart.refetch();
            void addresses.refetch();
          }}
        >
          다시 시도
        </Button>
      </div>
    );
  const lines = cart.data.lines.filter((line) =>
    ids.includes(Number(line.lineId)),
  );
  if (!ids.length || lines.length !== ids.length)
    return (
      <div className="p-16">
        <p>선택한 장바구니 상품을 확인할 수 없습니다.</p>
        <Link href="/cart">장바구니로 이동</Link>
      </div>
    );
  const selectedAddress =
    addressId ?? addresses.data.find((address) => address.isDefault)?.id;
  const productAmount = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const shippingAmount = getCartShippingAmount(cart.data.sections, lines);
  async function submit() {
    if (submitting.current) return;
    if (
      !selectedAddress ||
      !method ||
      method === "BANK_TRANSFER" ||
      !agreed ||
      memo.length > 100 ||
      lines.some((line) => line.soldOut)
    ) {
      setError("배송지, 결제수단, 약관 동의를 확인해 주세요.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const paymentMethod =
        method === "REALTIME_TRANSFER"
          ? "TRANSFER"
          : method === "TOSS_PAY"
            ? "EASY_PAY"
            : "CARD";
      const input: CreateOrderInput = {
        cartItemIds: ids,
        addressId: selectedAddress,
        deliveryRequest: memo.trim(),
        paymentMethod,
      };
      const key = getOrderRequestKey(
        input,
        JSON.stringify({
          memberId: user?.id,
          lines: lines.map(({ lineId, quantity, unitPrice, options }) => ({
            lineId,
            quantity,
            unitPrice,
            options,
          })),
          shippingAmount,
        }),
      );
      const order = await create.mutateAsync({
        input,
        key,
      });
      if (["PAYMENT_FAILED", "CANCELED"].includes(order.status))
        clearOrderRequestKey(key);
      if (order.status !== "CREATED")
        throw new Error(
          "이미 처리된 주문입니다. 주문 내역에서 상태를 확인해 주세요.",
        );
      if (
        order.totalAmount !== productAmount + shippingAmount &&
        (revisedOrder?.key !== key || revisedOrder.amount !== order.totalAmount)
      ) {
        setRevisedOrder({ key, amount: order.totalAmount });
        throw new Error(
          `최종 주문 금액이 ${order.totalAmount.toLocaleString("ko-KR")}원으로 변경되었습니다. 변경된 금액을 확인한 뒤 결제 버튼을 다시 눌러 주세요.`,
        );
      }
      const payment = await prepare.mutateAsync({
        orderId: order.orderId,
        amount: order.totalAmount,
        paymentMethod,
      });
      if (
        payment.orderId !== order.orderId ||
        payment.amount !== order.totalAmount
      )
        throw new Error("결제 금액을 확인할 수 없습니다.");
      if (!payment.tossClientKey.trim())
        throw new Error(
          "결제 서비스 설정이 완료되지 않아 결제할 수 없습니다. 주문 내역에서 상태를 확인해 주세요.",
        );
      savePaymentContext({
        requestKey: key,
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        amount: payment.amount,
      });
      const toss = await loadTossPayments(payment.tossClientKey);
      const common = {
        amount: { currency: "KRW" as const, value: payment.amount },
        orderId: order.orderNumber,
        orderName:
          lines[0]!.productName +
          (lines.length > 1 ? ` 외 ${lines.length - 1}건` : ""),
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
      };
      const gateway = toss.payment({ customerKey: ANONYMOUS });
      if (paymentMethod === "TRANSFER") {
        await gateway.requestPayment({ ...common, method: "TRANSFER" });
      } else {
        await gateway.requestPayment({
          ...common,
          method: "CARD",
          card:
            paymentMethod === "EASY_PAY"
              ? { flowMode: "DIRECT", easyPay: "TOSSPAY" }
              : undefined,
        });
      }
    } catch (cause) {
      setError(getPaymentErrorMessage(cause));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-[936px] space-y-8 px-6 py-16">
      <header className="mb-12 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <h1 className="text-title-xl">주문 결제</h1>
        <PurchaseStepIndicator current={2} />
      </header>
      <div className="grid gap-8 md:grid-cols-[1fr_318px]">
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-title-m">배송지</h2>
            {addresses.data.map((address) => (
              <label key={address.id} className="block border p-3">
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddress === address.id}
                  onChange={() => setAddressId(address.id)}
                  disabled={busy}
                />
                <span className="ml-2">
                  {address.recipientName} · {address.phone}
                  <br />
                  {address.address1} {address.address2}
                </span>
              </label>
            ))}
            {!addresses.data.length && <p>배송지를 추가해 주세요.</p>}
            <Button
              variant="outline"
              onClick={() => setModal(true)}
              disabled={busy}
            >
              배송지 추가
            </Button>
            <p className="text-caption">
              주문자 정보는 회원 정보를 사용합니다. 변경은 마이페이지에서 할 수
              있습니다.
            </p>
          </section>
          <label className="block">
            배송 요청사항
            <textarea
              aria-label="배송 요청사항"
              className="mt-2 block w-full border p-3"
              maxLength={100}
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              disabled={busy}
            />
          </label>
          <CheckoutProducts
            lines={lines}
            onArtisanClick={() => setError("장인 상세 페이지는 준비 중입니다.")}
          />
          <p className="text-caption">
            쿠폰·포인트 할인은 현재 지원하지 않습니다.
          </p>
          <fieldset disabled={busy}>
            <PaymentsMethod
              value={method}
              onChange={setMethod}
              disabledMethods={["BANK_TRANSFER"]}
            />
          </fieldset>
          <p className="text-caption">
            무통장입금은 입금 확인 기능 준비 중으로 사용할 수 없습니다.
          </p>
        </div>
        <aside className="space-y-5">
          <OrderSummary
            productAmount={productAmount}
            shippingAmount={shippingAmount}
            totalAmount={productAmount + shippingAmount}
            totalLabel="총 주문금액"
          />
          <label className="block">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              disabled={busy}
            />{" "}
            주문 상품과 결제 금액을 확인하고 구매에 동의합니다.
          </label>
          <Button
            className="w-full"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy
              ? "결제 준비 중…"
              : revisedOrder
                ? `${revisedOrder.amount.toLocaleString("ko-KR")}원 확인 후 결제`
                : "결제하기"}
          </Button>
          <p className="text-caption">
            최종 결제 금액은 서버에서 확인한 주문 금액입니다.
          </p>
          {error && <p role="alert">{error}</p>}
          <Link href="/mypage/orders">주문 내역 확인</Link>
        </aside>
      </div>
      {modal && (
        <AddressFormModal
          open
          mode="add"
          submitting={createAddress.isPending}
          submitError={addressError}
          onOpenChange={setModal}
          onSubmit={async (input) => {
            setAddressError("");
            try {
              const address = await createAddress.mutateAsync(input);
              setAddressId(address.id);
              setModal(false);
            } catch {
              setAddressError(
                "배송지를 저장하지 못했습니다. 다시 시도해 주세요.",
              );
            }
          }}
        />
      )}
    </main>
  );
}
