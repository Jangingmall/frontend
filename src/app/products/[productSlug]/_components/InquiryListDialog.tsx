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
      className="max-w-140"
    >
      <div className="mb-3 flex justify-end">
        <Checkbox
          checked={excludeSecret}
          onCheckedChange={onExcludeSecretChange}
        >
          비밀글 제외
        </Checkbox>
      </div>
      <div className="max-h-137 overflow-y-auto">
        {items.length ? (
          <Accordion>
            {items.map((inquiry) => (
              <InquiryItem key={inquiry.id} inquiry={inquiry} />
            ))}
          </Accordion>
        ) : (
          <EmptyState title="표시할 문의가 없습니다." />
        )}
      </div>
      <div className="mt-6 flex gap-2">
        <Button
          variant="outline"
          size="xl"
          onClick={() => onOpenChange(false)}
          className="min-w-0 flex-1 px-3 sm:w-40 sm:flex-none sm:px-6"
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
    </Dialog>
  );
}
