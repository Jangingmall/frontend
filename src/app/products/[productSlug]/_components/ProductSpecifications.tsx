import type { ProductInformationRow } from "@/types/product-detail";

interface ProductSpecificationsProps {
  rows: ProductInformationRow[];
}

export function ProductSpecifications({ rows }: ProductSpecificationsProps) {
  return (
    <section
      aria-labelledby="product-specifications-title"
      className="border-t border-border-neutral-weak px-2 pt-4"
    >
      <h2 id="product-specifications-title" className="mb-3 text-title-l">
        상품 상세 정보
      </h2>
      {rows.length ? (
        <dl className="px-1">
          {rows.map((row, index) => (
            <div
              key={`${row.label}-${index}`}
              className="flex border-b border-border-jade-weak text-body-s last:border-b-0"
            >
              <dt className="w-22.5 shrink-0 border-r border-border-jade-weak bg-fill-jade-weak px-3 py-2 font-semibold text-font-dark-secondary">
                {row.label}
              </dt>
              <dd className="min-w-0 px-3 py-2 whitespace-pre-line text-font-dark-subtle">
                {row.content}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-body-m text-font-dark-subtle">
          상세 정보를 준비하고 있습니다.
        </p>
      )}
    </section>
  );
}
