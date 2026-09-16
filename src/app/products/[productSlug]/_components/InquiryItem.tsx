import { AccordionItem } from "@/components/ui/accordion";
import { LockIcon } from "@/components/ui/icons";
import type { ProductInquiry } from "@/types/inquiry";

interface InquiryItemProps {
  inquiry: ProductInquiry;
}

export function InquiryItem({ inquiry }: InquiryItemProps) {
  const summary = (
    <span className="flex min-w-0 flex-col text-left">
      <span className="mb-1 text-caption-b text-font-dark-subtle">
        {inquiry.type}
      </span>
      <span className="flex items-center gap-2 text-body font-bold text-font-dark-secondary">
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
      className="[&>[role=region]>div]:p-0 [&>h3>button]:border-border-jade-weak [&>h3>button]:px-0 [&>h3>button]:pt-0 [&>h3>button]:pb-3 last:[&>h3>button:not([data-panel-open])]:border-b-0 [&>h3>button>svg]:size-5"
    >
      {!inquiry.canRead ? (
        <p className="bg-bg-subtle px-4 pt-3 pb-4 text-body-s text-font-dark">
          작성자만 확인할 수 있는 비밀글입니다.
        </p>
      ) : (
        <div className="bg-bg-subtle px-4 pt-3 pb-4 text-body-s text-font-dark">
          <p className="whitespace-pre-wrap">{inquiry.body}</p>
          {inquiry.reply && (
            <div className="mt-3 space-y-2 border-t border-border-jade-weak pt-3">
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
