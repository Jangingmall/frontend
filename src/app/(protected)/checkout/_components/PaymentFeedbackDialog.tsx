import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
export type PaymentFailure = "declined" | "timeout" | "cancelled";
const COPY = {
  declined: {
    title: "결제에 실패했습니다.",
    description:
      "카드사 사정에 따라 결제가 거절되었습니다.\n카드 정보를 확인하거나 다른 결제 수단을 이용해주세요.",
  },
  timeout: {
    title: "결제 요청 시간이 초과되었습니다.",
    description:
      "네트워크 상태에 따라 결제 처리가 지연되었습니다.\n잠시 후 다시 시도해주세요.",
  },
  cancelled: {
    title: "결제가 완료되지 않았습니다.",
    description: "장바구니에 담긴 상품은 그대로 보관되어 있습니다.",
  },
};
interface PaymentFeedbackDialogProps {
  outcome: PaymentFailure | null;
  onClose: () => void;
  onCart: () => void;
}
export function PaymentFeedbackDialog({
  outcome,
  onClose,
  onCart,
}: PaymentFeedbackDialogProps) {
  const copy = COPY[outcome ?? "declined"];
  return (
    <Dialog
      open={outcome !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      variant="confirmation"
      title={copy.title}
      description={
        <span className="whitespace-pre-line">{copy.description}</span>
      }
    >
      <div className="flex gap-3 max-sm:flex-col">
        {outcome === "cancelled" ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="xl"
              className="flex-1 px-3"
              onClick={onCart}
            >
              장바구니로 돌아가기
            </Button>
            <Button
              type="button"
              size="xl"
              className="flex-1 px-3"
              onClick={onClose}
            >
              결제 계속하기
            </Button>
          </>
        ) : (
          <Button type="button" size="xl" className="w-full" onClick={onClose}>
            다시 시도
          </Button>
        )}
      </div>
    </Dialog>
  );
}
