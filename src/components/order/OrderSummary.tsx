import type { ReactNode } from "react";
export interface OrderSummaryProps {
  productAmount: number;
  shippingAmount: number;
  totalAmount: number;
  totalLabel?: string;
  children?: ReactNode;
}
export function OrderSummary({
  productAmount,
  shippingAmount,
  totalAmount,
  totalLabel = "결제예정금액",
  children,
}: OrderSummaryProps) {
  const money = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;
  return (
    <aside
      aria-label="결제 정보"
      className="rounded-xs bg-bg-default p-6 text-font-dark shadow-floating"
    >
      <h2 className="text-title-l">결제 정보</h2>
      <dl className="mt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <dt className="text-body-m font-bold">총 상품금액</dt>
          <dd className="text-body-l">{money(productAmount)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-body-m font-bold">총 배송비</dt>
          <dd className="text-body-l">
            {shippingAmount ? money(shippingAmount) : "-"}
          </dd>
        </div>
        <div className="flex items-center justify-between border-t border-border-neutral-weak pt-3">
          <dt className="text-body-m font-bold">{totalLabel}</dt>
          <dd className="text-title-m">{money(totalAmount)}</dd>
        </div>
      </dl>
      {children && <div className="mt-12">{children}</div>}
    </aside>
  );
}
