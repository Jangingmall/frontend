import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
export function PurchaseStepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <Breadcrumb>
      {["장바구니", "주문 결제", "주문 완료"].map((label, index) => (
        <BreadcrumbItem
          key={label}
          index={`0${index + 1}`}
          current={current === index + 1}
          className={current === index + 1 ? "font-bold" : undefined}
        >
          {label}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
}
