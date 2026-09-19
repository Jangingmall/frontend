import { Button } from "@/components/ui/button";

interface OrderDetailInfoBarProps {
  orderNumber: string;
  orderDate: string;
}

/**
 * 주문 상세 상단 정보 바. 목록 화면의 `OrderInfoBar`(T-21)와 달리 상태 배지가 없고
 * "주문 영수증" 버튼이 있다 — Figma 실측(`1341:22567`, `badge-order-states`가
 * `hidden`)으로 확인된, 목록과는 다른 별개 컴포넌트다. "주문 영수증"은 영수증 조회
 * 기능 자체가 이번 작업 범위 밖이라 비활성 처리한다.
 */
export function OrderDetailInfoBar({
  orderNumber,
  orderDate,
}: OrderDetailInfoBarProps) {
  return (
    <div className="flex items-center gap-4 bg-fill-jade-weak px-3 py-2 text-font-dark">
      <div className="flex shrink-0 items-center gap-1 text-title-s">
        <span>주문번호 :</span>
        <span>{orderNumber}</span>
      </div>
      <div className="flex flex-1 items-center gap-1 truncate text-body-s">
        <span>주문일시 :</span>
        <span>{orderDate}</span>
      </div>
      <Button
        variant="outline"
        size="xs"
        disabled
        aria-label="주문 영수증 준비 중"
      >
        주문 영수증
      </Button>
    </div>
  );
}
