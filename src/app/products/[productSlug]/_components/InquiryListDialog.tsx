import { EmptyState } from "@/components/common/empty-state";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import type { ProductInquiry } from "@/types/inquiry";

import { InquiryItem } from "./InquiryItem";

interface InquiryListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ProductInquiry[];
  excludeSecret: boolean;
  onExcludeSecretChange: (value: boolean) => void;
  onCompose: () => void;
  isComposingDisabled?: boolean;
}
export function InquiryListDialog({
  open,
  onOpenChange,
  items,
  excludeSecret,
  onExcludeSecretChange,
  onCompose,
  isComposingDisabled = false,
}: InquiryListDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="문의 전체보기"
      variant="form"
      headerAction={
        <Checkbox
          checked={excludeSecret}
          onCheckedChange={onExcludeSecretChange}
        >
          비밀글 제외
        </Checkbox>
      }
      footer={
        <div className="flex gap-2.5">
          <Button
            variant="jade"
            size="xl"
            onClick={() => onOpenChange(false)}
            className="min-w-0 flex-1 border-border-neutral-subtle px-3 sm:w-40 sm:flex-none sm:px-6"
          >
            닫기
          </Button>
          <Button
            size="xl"
            className="min-w-0 flex-1 px-3 sm:px-6"
            onClick={onCompose}
            disabled={isComposingDisabled}
          >
            문의하기
          </Button>
        </div>
      }
    >
      {items.length ? (
        <Accordion className="[&_[data-slot=accordion]]:space-y-2">
          {items.map((inquiry) => (
            <InquiryItem key={inquiry.id} inquiry={inquiry} />
          ))}
        </Accordion>
      ) : (
        <EmptyState title="표시할 문의가 없습니다." />
      )}
    </Dialog>
  );
}
