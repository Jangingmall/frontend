export function formatPriceLabel(price: number): string {
  if (price >= 10000) {
    return `${(price / 10000).toLocaleString("ko-KR", { maximumFractionDigits: 4 })}만 원`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toLocaleString("ko-KR", { maximumFractionDigits: 3 })}천 원`;
  }
  return `${price.toLocaleString("ko-KR")}원`;
}
