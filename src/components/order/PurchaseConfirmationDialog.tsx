"use client";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
interface Props {
  open: boolean;
  orderNumber: string;
  submitting: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
export function PurchaseConfirmationDialog({
  open,
  orderNumber,
  submitting,
  error,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
      variant="confirmation"
      title="주문 전체를 구매 확정하시겠습니까?"
      description={`주문번호 ${orderNumber}에 포함된 모든 상품이 함께 구매 확정됩니다. 확정 후에는 이 주문의 교환·환불을 신청할 수 없습니다.`}
    >
      {error && (
        <p role="alert" className="mb-4 text-body-s text-red-font">
          {error}
        </p>
      )}
      <div className="flex gap-2.5">
        <Button
          variant="outline"
          size="xl"
          className="flex-1"
          disabled={submitting}
          onClick={() => onOpenChange(false)}
        >
          취소
        </Button>
        <Button
          size="xl"
          className="flex-1"
          loading={submitting}
          onClick={onConfirm}
        >
          주문 전체 구매 확정
        </Button>
      </div>
    </Dialog>
  );
}
