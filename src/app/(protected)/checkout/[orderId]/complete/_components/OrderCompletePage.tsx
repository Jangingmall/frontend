"use client";

import { PurchaseStepIndicator } from "@/components/order/PurchaseStepIndicator";
import { Button } from "@/components/ui/button";

import { ORDER_COMPLETE_FIXTURE } from "./order-complete-fixture";
import type { OrderCompleteOutcome } from "./order-complete-state";

interface OrderCompletePageProps {
  outcome: OrderCompleteOutcome;
  totalAmount?: number;
  orderNumber?: string;
  onViewOrders: () => void;
  onContinueBrowsing: () => void;
}

const wonFormatter = new Intl.NumberFormat("ko-KR");

export function OrderCompletePage({
  outcome,
  totalAmount = ORDER_COMPLETE_FIXTURE.fallbackTotalAmount,
  orderNumber = ORDER_COMPLETE_FIXTURE.orderNumber,
  onViewOrders,
  onContinueBrowsing,
}: OrderCompletePageProps) {
  const isBankPending = outcome === "bank-pending";

  return (
    <div className="flex flex-1 flex-col bg-bg-subtle px-6 pt-16">
      <div className="mx-auto w-full max-w-[888px]">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
          <h1 className="text-title-xl text-font-dark">주문 완료</h1>
          <div className="max-w-full overflow-x-auto">
            <PurchaseStepIndicator current={3} />
          </div>
        </div>

        <section
          className={`mx-auto flex flex-col items-center text-center ${
            isBankPending ? "mt-32 mb-[200px]" : "mt-32 mb-[234px]"
          }`}
          aria-labelledby="order-complete-heading"
        >
          <div className="flex flex-col items-center gap-2">
            <h2
              id="order-complete-heading"
              className="text-title-xl text-font-dark"
            >
              주문이 완료되었습니다
            </h2>
            <p className="text-body text-font-dark-subtle">
              주문번호: {orderNumber}
            </p>
          </div>

          <p className="mt-6 text-body-l text-font-dark">
            {isBankPending
              ? "아래의 계좌로 입금해주시면 정상적으로 결제 완료 처리가 됩니다."
              : "장인이 주문을 확인한 후 제작을 시작할 예정입니다."}
          </p>

          {isBankPending ? (
            <BankTransferDetails totalAmount={totalAmount} />
          ) : null}

          <div
            className={`flex w-full max-w-[424px] gap-2 max-sm:flex-col ${
              isBankPending ? "mt-10" : "mt-16"
            }`}
          >
            <Button
              type="button"
              size="l"
              className="min-w-0 flex-1 max-sm:w-full max-sm:flex-none"
              onClick={onViewOrders}
            >
              주문 내역 보기
            </Button>
            <Button
              type="button"
              size="l"
              className="min-w-0 flex-1 max-sm:w-full max-sm:flex-none"
              onClick={onContinueBrowsing}
            >
              계속 둘러보기
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function BankTransferDetails({ totalAmount }: { totalAmount: number }) {
  return (
    <div className="mt-7 w-full max-w-[520px] bg-bg-default p-4 text-left shadow-floating">
      <h3 className="text-body-s-b text-font-dark">가상계좌 정보</h3>
      <dl className="mt-3 grid grid-cols-[90px_minmax(0,1fr)] gap-x-2 gap-y-1 text-body">
        <dt className="font-bold text-font-dark-secondary">계좌정보</dt>
        <dd className="break-all text-font-dark-subtle">
          {ORDER_COMPLETE_FIXTURE.bankName}{" "}
          {ORDER_COMPLETE_FIXTURE.accountNumber} (예금주:{" "}
          {ORDER_COMPLETE_FIXTURE.accountHolder})
        </dd>
        <dt className="font-bold text-font-dark-secondary">결제 금액</dt>
        <dd className="text-font-dark-subtle">
          {wonFormatter.format(totalAmount)}원
        </dd>
        <dt className="font-bold text-font-dark-secondary">입금 기간</dt>
        <dd className="text-font-dark-subtle">
          {ORDER_COMPLETE_FIXTURE.depositDeadline}
        </dd>
      </dl>
    </div>
  );
}
