import { ArtisanOrderGroup } from "@/components/order/ArtisanOrderGroup";
import { ProductOrder } from "@/components/product/ProductOrder";
import type { CartPreviewLine } from "@/types/purchase-preview";
interface CheckoutProductsProps {
  lines: CartPreviewLine[];
  onArtisanClick: () => void;
}
export function CheckoutProducts({
  lines,
  onArtisanClick,
}: CheckoutProductsProps) {
  const groups = Map.groupBy(lines, (line) => line.artisanId);
  return (
    <section className="space-y-3">
      <h2 className="text-title-m">주문 작품 정보 ({lines.length}건)</h2>
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
                options={line.options}
                quantity={line.quantity}
                price={line.unitPrice * line.quantity}
                note={line.note}
              />
            </div>
          ))}
        </ArtisanOrderGroup>
      ))}
    </section>
  );
}
