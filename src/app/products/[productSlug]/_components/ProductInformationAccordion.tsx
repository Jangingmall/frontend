import { Accordion, AccordionItem } from "@/components/ui/accordion";
import type { ProductInformationRow } from "@/types/product-detail";

interface ProductInformationAccordionProps {
  id: string;
  title: string;
  rows: ProductInformationRow[];
}

export function ProductInformationAccordion({
  id,
  title,
  rows,
}: ProductInformationAccordionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-40 border-t border-border-neutral-weak px-2 pt-4"
    >
      <h2
        id={`${id}-title`}
        className="mb-3 text-title-l leading-[1.3] font-bold"
      >
        {title}
      </h2>
      {rows.length ? (
        <Accordion multiple>
          {rows.map((row, index) => (
            <AccordionItem
              key={`${row.label}-${index}`}
              value={String(index)}
              title={<span className="text-title-s">{row.label}</span>}
              className="border-t border-border-jade-weak [&_h3>button]:border-0 [&_h3>button]:px-3 [&_h3>button]:py-3 [&_svg]:size-6"
            >
              <div className="px-2 pb-1 text-body leading-normal text-font-dark-subtle">
                {row.content && (
                  <p className="whitespace-pre-line">{row.content}</p>
                )}
                {!!row.details?.length && (
                  <dl className="space-y-1">
                    {row.details.map((detail) => (
                      <div
                        key={detail.label}
                        className="flex items-start gap-2"
                      >
                        <dt className="w-22.5 shrink-0 font-bold text-font-dark-secondary">
                          {detail.label}
                        </dt>
                        <dd className="min-w-0 break-words whitespace-pre-line">
                          {detail.content}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-body-m text-font-dark-subtle">
          안내 정보를 준비하고 있습니다.
        </p>
      )}
    </section>
  );
}
