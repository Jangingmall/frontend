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
      <h2 id={`${id}-title`} className="mb-3 text-title-l">
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
              <p className="px-1 pb-2 text-body-s leading-relaxed whitespace-pre-line">
                {row.content}
              </p>
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
