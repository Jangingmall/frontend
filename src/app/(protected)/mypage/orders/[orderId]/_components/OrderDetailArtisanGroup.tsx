import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { OrderCardActionType } from "@/constants/order";
import type { Money } from "@/types/money";
import type {
  OrderDetailArtisanGroup as OrderDetailArtisanGroupModel,
  OrderDetailItem,
} from "@/types/order";

import { OrderDetailItemCard } from "./OrderDetailItemCard";

interface OrderDetailArtisanGroupProps {
  group: OrderDetailArtisanGroupModel;
  shippingAmount: Money;
  orderedAt: string;
  paymentMethod?: string | null;
  onAction: (item: OrderDetailItem, action: OrderCardActionType) => void;
}

/**
 * 제작자(장인) 단위로 묶은 상품 섹션. "장인 이름 >"·"판매자 정보"는 장인 상세 페이지(AD-1)
 * 자체가 프로젝트 범위 밖이라 항상 비활성 처리한다 — 상품 상세(PD-1)의 `ArtisanSummary`와
 * 같은 결정을 그대로 따른다(design.md §4.2).
 */
export function OrderDetailArtisanGroup({
  group,
  shippingAmount,
  orderedAt,
  paymentMethod,
  onAction,
}: OrderDetailArtisanGroupProps) {
  const artisanName = group.artisanName ?? "제작자 정보 준비 중";

  return (
    <section className="overflow-hidden rounded-xs bg-bg-default shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between bg-fill-neutral-weak px-4 py-3">
        {/* Figma엔 "비활성" 상태 표현이 없다 — 범위 밖이라 클릭만 막을 뿐 문구는
            평소처럼 진하게 보여야 해서 Button 기본 disabled:opacity-60을
            disabled:opacity-100으로 덮어쓴다(장인 이름·판매자 정보 공통). */}
        <Button
          variant="ghost"
          size="s"
          disabled
          className="h-auto gap-0 p-0 text-title-m disabled:opacity-100"
          aria-label={`${artisanName} 상세 준비 중`}
        >
          {artisanName}
          <ChevronRightIcon aria-hidden className="size-5.5" />
        </Button>
        {/* Figma 실측 — "판매자 정보"는 테두리 없는 밑줄 텍스트 링크다("주문 영수증"·
            "배송지 변경"과 달리 border 클래스가 없음). */}
        <Button
          variant="ghost"
          size="xs"
          disabled
          className="underline underline-offset-2 disabled:opacity-100"
          aria-label="판매자 정보 준비 중"
        >
          판매자 정보
        </Button>
      </div>
      <div className="flex flex-col">
        {group.items.map((item) => (
          <OrderDetailItemCard
            key={item.orderItemId}
            item={item}
            shippingAmount={shippingAmount}
            orderedAt={orderedAt}
            paymentMethod={paymentMethod}
            onAction={(action) => onAction(item, action)}
          />
        ))}
      </div>
    </section>
  );
}
