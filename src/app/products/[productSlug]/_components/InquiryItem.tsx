import { AccordionItem } from "@/components/ui/accordion";
import { LockIcon } from "@/components/ui/icons";
import type { ProductInquiry } from "@/types/inquiry";

interface InquiryItemProps {
  inquiry: ProductInquiry;
}

export function InquiryItem({ inquiry }: InquiryItemProps) {
  const summary = (
    <span className="flex min-w-0 flex-col gap-1 text-left">
      <span className="text-caption-b text-font-dark-subtle">
        {inquiry.type}
      </span>
      <span className="flex items-center gap-2 text-body-s-b">
        {inquiry.isSecret && <LockIcon className="size-4" />}
        {inquiry.title}
      </span>
      <span className="text-caption font-normal text-font-dark-weak">
        {inquiry.status === "ANSWERED" ? "답변 완료" : "답변 대기"} ·{" "}
        {inquiry.author} · {inquiry.createdAt.replaceAll("-", ".")}
      </span>
    </span>
  );
  return (
    <AccordionItem
      value={inquiry.id}
      title={summary}
      className="border-b border-border-jade-weak py-2 [&_[data-slot=accordion-item]]:border-0"
    >
      {!inquiry.canRead ? (
        <p className="bg-fill-jade-weak p-4 text-body-s">
          작성자만 확인할 수 있는 비밀글입니다.
        </p>
      ) : (
        <div className="bg-fill-jade-weak p-4 text-body-s">
          <p className="whitespace-pre-wrap">{inquiry.body}</p>
          {inquiry.reply && (
            <div className="mt-4 space-y-2 border-t border-border-jade-weak pt-4">
              <p>답변. {inquiry.reply.author}</p>
              <p className="whitespace-pre-wrap">{inquiry.reply.body}</p>
              <p className="text-caption text-font-dark-weak">
                {inquiry.reply.createdAt.replaceAll("-", ".")}
              </p>
            </div>
          )}
        </div>
      )}
    </AccordionItem>
  );
}
