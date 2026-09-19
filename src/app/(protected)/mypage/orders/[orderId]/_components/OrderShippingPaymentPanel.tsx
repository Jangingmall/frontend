import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { OrderPaymentSummary, OrderShippingAddress } from "@/types/order";

/**
 * `components/order/PaymentsMethod.tsx`(결제 화면 CO-1)와 같은 도메인 값이지만, 이 패널은
 * 선택이 아니라 이미 결제된 수단을 보여주기만 하는 별개 화면 목적이라 로컬로 둔다(성급한
 * 공용화 지양, architecture.md §9).
 */
const PAYMENT_METHOD_LABEL: Record<string, string> = {
  REALTIME_TRANSFER: "실시간 계좌이체",
  BANK_TRANSFER: "무통장입금",
  CARD: "신용·체크카드",
  TOSS_PAY: "토스페이",
};

function formatPhone(phone: string): string {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}

interface AmountRowProps {
  label: string;
  amount: number;
  emphasis?: boolean;
  /** "결제 금액" 행 전용 — Figma 실측 "총 57,000원" 접두어(design.md 대조, 2080:1271:52868). */
  valuePrefix?: string;
}

function AmountRow({
  label,
  amount,
  emphasis = false,
  valuePrefix,
}: AmountRowProps) {
  return (
    <div
      className={
        emphasis
          ? "flex justify-between text-title-s"
          : "flex justify-between text-body-s text-font-dark-subtle"
      }
    >
      <span>{label}</span>
      <span>
        {valuePrefix}
        {amount.toLocaleString("ko-KR")}원
      </span>
    </div>
  );
}

interface OrderShippingPaymentPanelProps {
  address: OrderShippingAddress;
  payment: OrderPaymentSummary;
  /** 입금 확인 중·상품 준비 중 상태에서만 배송지 변경을 허용한다(design.md §4.3). */
  canChangeAddress: boolean;
  onChangeAddress: () => void;
}

/** 주문 상세 우측 패널 — 배송지 정보 + 결제 정보(Figma "Shipping Info"). */
export function OrderShippingPaymentPanel({
  address,
  payment,
  canChangeAddress,
  onChangeAddress,
}: OrderShippingPaymentPanelProps) {
  const paymentMethodLabel = payment.paymentMethod
    ? (PAYMENT_METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod)
    : "-";
  // Figma 실측 — "결제 정보" 제목 옆에 chevron-down이 있어 접기/펼치기 토글이다
  // (`배송지` 제목엔 없음, 이 섹션만). 기본은 펼침(Figma 프레임이 펼쳐진 상태로 그려짐).
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(true);

  return (
    <aside className="flex w-full flex-col gap-6 text-font-dark lg:w-137 lg:shrink-0">
      <div className="overflow-hidden rounded-xs bg-bg-default shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between bg-fill-neutral-weak px-4 py-3">
          <h2 className="text-title-s">배송지</h2>
          {canChangeAddress && (
            <Button variant="outline" size="xs" onClick={onChangeAddress}>
              배송지 변경
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-2 px-4 pt-3 pb-6 text-body-s text-font-dark">
          <div className="flex items-center gap-2">
            <span>받는 분 :</span>
            <span className="text-title-s">{address.recipientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>휴대전화 :</span>
            <span className="text-font-dark-secondary">
              {formatPhone(address.phone)}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span>주소지 :</span>
            <span className="text-font-dark-secondary">
              ({address.zipCode}) {address.address1} {address.address2}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xs bg-bg-default shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={() => setIsPaymentExpanded((prev) => !prev)}
          aria-expanded={isPaymentExpanded}
          className="flex w-full items-center justify-between bg-fill-neutral-weak px-4 py-3"
        >
          <h2 className="text-title-s">결제 정보</h2>
          <ChevronDownIcon
            aria-hidden
            className={cn(
              "size-6 transition-transform",
              !isPaymentExpanded && "rotate-180",
            )}
          />
        </button>
        {isPaymentExpanded && (
          <div className="flex flex-col gap-3 px-4 pt-3 pb-6">
            <div className="flex flex-col gap-2">
              <AmountRow label="상품 금액" amount={payment.productAmount} />
              <AmountRow label="배송비" amount={payment.shippingAmount} />
              <AmountRow label="할인 금액" amount={-payment.discountAmount} />
              <AmountRow label="적립금 사용" amount={-payment.pointsUsed} />
            </div>
            <div className="flex flex-col gap-2 border-t border-border-jade-fill pt-3">
              <AmountRow
                label="결제 금액"
                amount={payment.totalAmount}
                emphasis
                valuePrefix="총 "
              />
              <div className="flex justify-between text-body-s text-font-dark-subtle">
                <span>결제 수단</span>
                <span>{paymentMethodLabel}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
