import { ArtisanOrderGroup } from "@/components/order/ArtisanOrderGroup";
import { ProductOrder } from "@/components/product/ProductOrder";
import type { CartPreviewLine } from "@/types/purchase-preview";
interface CheckoutProductsProps {
  lines: CartPreviewLine[];
  showUnavailableDetails?: boolean;
  onArtisanClick: () => void;
}
export function CheckoutProducts({
  lines,
  showUnavailableDetails = false,
  onArtisanClick,
}: CheckoutProductsProps) {
  const groups = Map.groupBy(lines, (line) => line.artisanId);
  return (
    <section className="space-y-3">
      <h2 className="text-title-m">주문 작품 정보 ({lines.length}건)</h2>
      {!lines.length && (
        <p className="rounded-xs border border-border-jade-weak p-6 text-body-s text-font-dark-weak">
          주문할 작품이 없습니다. 장바구니에서 작품을 선택해 주세요.
        </p>
      )}
      {Array.from(groups, ([id, items]) => (
        <ArtisanOrderGroup
          key={id}
          artisanName={items[0].artisanName}
          onArtisanClick={onArtisanClick}
        >
          {items.map((line) => (
            <div
              key={line.lineId}
              className="py-4 not-last:border-b not-last:border-border-jade-weak"
            >
              <ProductOrder
                variant="stacked"
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
              />
            </div>
          ))}
        </ArtisanOrderGroup>
      ))}
    </section>
  );
}
