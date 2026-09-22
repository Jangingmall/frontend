"use client";
import { ProductOrder } from "@/components/product/ProductOrder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CancelIcon } from "@/components/ui/icons";
import { Stepper } from "@/components/ui/stepper";
import type { CartPreviewLine } from "@/types/purchase-preview";
interface CartProductCardProps {
  line: CartPreviewLine;
  pending?: boolean;
  showUnavailableDetails?: boolean;
  optionsDisabled?: boolean;
  onSelect: (selected: boolean) => void;
  onQuantity: (value: number) => void;
  onDelete: () => void;
  onOptions: () => void;
}
export function CartProductCard({
  line,
  pending = false,
  showUnavailableDetails = false,
  optionsDisabled = false,
  onSelect,
  onQuantity,
  onDelete,
  onOptions,
}: CartProductCardProps) {
  return (
    <article
      aria-label={line.productName}
      className="relative py-3 not-last:border-b not-last:border-border-neutral-weak"
    >
      <div className="absolute top-3 left-0">
        <Checkbox
          aria-label={`${line.productName} 선택`}
          checked={line.selected && !line.soldOut}
          disabled={line.soldOut || pending}
          onCheckedChange={onSelect}
        />
      </div>
      <Button
        variant="ghost"
        size="xs"
        aria-label={`${line.productName} 삭제`}
        disabled={pending}
        onClick={onDelete}
        className="absolute top-1 right-0 z-10 size-6 min-w-0 p-0"
      >
        <CancelIcon className="size-4" />
      </Button>
      <div className="pl-6">
        <ProductOrder
          thumbnail={line.thumbnail}
          productName={line.productName}
          options={
            line.options.length || !showUnavailableDetails
              ? line.options
              : ["옵션 정보가 제공되지 않았습니다."]
          }
          quantity={line.quantity}
          price={line.unitPrice * line.quantity}
          note={
            line.note ||
            (showUnavailableDetails
              ? "제작·배송 안내가 제공되지 않았습니다."
              : undefined)
          }
          variant="stacked"
          actions={
            <Button
              variant="outline"
              size="xs"
              disabled={line.soldOut || pending || optionsDisabled}
              title={
                optionsDisabled
                  ? "현재 옵션 변경은 지원되지 않습니다."
                  : undefined
              }
              onClick={onOptions}
            >
              {line.productPath ? "옵션 다시 선택" : "옵션 변경"}
            </Button>
          }
          quantityControl={
            <Stepper
              size="s"
              value={line.quantity}
              min={1}
              max={
                Number.isFinite(line.maxQuantity) ? line.maxQuantity : undefined
              }
              disabled={line.soldOut || pending}
              onValueChange={(value) => onQuantity(value ?? 1)}
              aria-label={`${line.productName} 수량`}
            />
          }
          thumbnailOverlay={
            line.soldOut ? (
              <div className="absolute inset-0 flex items-center justify-center bg-states-sold-out">
                <Badge variant="solid">품절</Badge>
              </div>
            ) : undefined
          }
        />
      </div>
    </article>
  );
}
