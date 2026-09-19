"use client";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
interface CartLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
}
export function CartLoginDialog({
  open,
  onOpenChange,
  onLogin,
}: CartLoginDialogProps) {
  return (
    <Dialog
      variant="confirmation"
      title="로그인 후 이용 가능한 서비스입니다"
      description="로그인 페이지로 이동하시겠습니까?"
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
        <Button className="flex-1" size="xl" onClick={onLogin}>
          로그인
        </Button>
      </div>
    </Dialog>
  );
}
