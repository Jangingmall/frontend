"use client";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
interface CartDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
export function CartDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
}: CartDeleteDialogProps) {
  return (
    <Dialog
      variant="confirmation"
      title="상품을 삭제할까요?"
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex gap-3">
        <Button
          className="flex-1"
          variant="jade"
          size="xl"
          onClick={() => onOpenChange(false)}
        >
          취소
        </Button>
        <Button className="flex-1" size="xl" onClick={onConfirm}>
          삭제하기
        </Button>
      </div>
    </Dialog>
  );
}
