import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/constants/order";

interface OrderInfoBarSingleProps {
  variant?: "single";
  status: OrderStatus;
  orderNumber: string;
  orderDate: string;
}

interface OrderInfoBarMultiProps {
  variant: "multi";
  /** "총 N 건" 표시 */
  itemCount: number;
  orderNumber: string;
  orderDate: string;
}

type OrderInfoBarProps = OrderInfoBarSingleProps | OrderInfoBarMultiProps;

/** 주문 단위 정보 바 — 상태 배지(또는 "총 N 건") + 주문번호 + 주문일시. */
export function OrderInfoBar(props: OrderInfoBarProps) {
  const badgeLabel =
    props.variant === "multi"
      ? `총 ${props.itemCount} 건`
      : ORDER_STATUS_LABEL[props.status];

  return (
    <div className="flex items-center gap-4 bg-fill-neutral-weak py-2 text-font-dark">
      <Badge variant="plain" className="shrink-0">
        {badgeLabel}
      </Badge>
      <div className="flex shrink-0 items-center gap-1 text-title-s">
        <span>주문번호 :</span>
        <span>{props.orderNumber}</span>
      </div>
      <div className="flex flex-1 items-center justify-end gap-1 truncate pr-3 text-body-s">
        <span>주문일시 :</span>
        <span>{props.orderDate}</span>
      </div>
    </div>
  );
}
