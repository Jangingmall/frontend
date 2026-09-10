/**
 * 원(KRW) 정수 금액. (docs/api-contract.md §2.2 — 모든 금액 필드는 `Long`, 소수 단위 없음)
 * `price`, `priceDelta`, `amount`, `totalAmount` 등에 쓴다. 포맷은 사용처에서.
 */
export type Money = number;
