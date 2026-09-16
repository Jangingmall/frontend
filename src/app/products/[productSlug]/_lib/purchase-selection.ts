import type { ProductDetail } from "@/types/product-detail";

export type ProductChoices = Record<string, string>;

export interface PurchaseSelection {
  key: string;
  choices: ProductChoices;
  optionLabels: Record<string, string>;
  label: string;
  unitPrice: number;
  stock: number;
  quantity: number;
}

/** 상품·조합의 재고를 확인할 수 없는 경우 구매 가능한 조합을 만들지 않는다. */
export function createSelection(
  product: ProductDetail,
  choices: ProductChoices,
): PurchaseSelection | null {
  if (
    product.status !== "ON_SALE" ||
    product.stock === null ||
    product.stock < 1
  )
    return null;
  const values = [];
  const optionLabels: Record<string, string> = {};
  const standardIds: string[] = [];
  let giftDelta = 0;
  for (const group of product.optionGroups) {
    const id = choices[group.id];
    const value = group.values.find((option) => option.id === id);
    if ((!value && group.required) || (id && !value)) return null;
    optionLabels[group.id] = value?.label ?? "선택 안 함";
    if (!value) continue;
    if (value.stock === null || value.stock < 1) return null;
    values.push(value);
    if (group.kind === "STANDARD") standardIds.push(value.id);
    else giftDelta += value.priceDelta;
  }
  const variant = product.variants?.find(
    (item) =>
      item.valueIds.length === standardIds.length &&
      item.valueIds.every((id) => standardIds.includes(id)),
  );
  if (product.variants !== null && (!variant || variant.stock < 1)) return null;
  const stock = Math.floor(
    Math.min(
      product.stock,
      variant?.stock ?? product.stock,
      ...values.map((value) => value.stock!),
    ),
  );
  const unitPrice =
    product.price +
    (variant
      ? variant.priceDelta + giftDelta
      : values.reduce((sum, value) => sum + value.priceDelta, 0));
  if (
    !Number.isFinite(stock) ||
    stock < 1 ||
    !Number.isSafeInteger(unitPrice) ||
    unitPrice < 0
  )
    return null;
  const validChoices = Object.fromEntries(
    product.optionGroups
      .filter((group) => choices[group.id])
      .map((group) => [group.id, choices[group.id]]),
  );
  return {
    key: JSON.stringify(Object.entries(validChoices)),
    choices: validChoices,
    optionLabels,
    label:
      product.optionGroups.map((group) => optionLabels[group.id]).join(" / ") ||
      product.name,
    unitPrice,
    stock,
    quantity: 1,
  };
}

export function addSelection(
  lines: PurchaseSelection[],
  selection: PurchaseSelection,
  product?: ProductDetail,
): PurchaseSelection[] {
  const previous = lines.find((line) => line.key === selection.key);
  return previous
    ? setSelectionQuantity(lines, selection.key, previous.quantity + 1, product)
    : [...lines, selection];
}

export function setSelectionQuantity(
  lines: PurchaseSelection[],
  key: string,
  quantity: number,
  product?: ProductDetail,
): PurchaseSelection[] {
  return lines.map((line) =>
    line.key === key
      ? {
          ...line,
          quantity: Number.isFinite(quantity)
            ? Math.max(
                1,
                Math.min(
                  product
                    ? getMaxSelectionQuantity(product, lines, key)
                    : line.stock,
                  Math.floor(quantity),
                ),
              )
            : line.quantity,
        }
      : line,
  );
}

/** 선물 유무가 달라도 동일 상품/일반 옵션 조합의 재고를 공유한다. */
export function getMaxSelectionQuantity(
  product: ProductDetail,
  lines: PurchaseSelection[],
  key: string,
): number {
  const line = lines.find((item) => item.key === key);
  if (!line || product.stock === null) return 0;
  const others = lines.filter((item) => item.key !== key);
  let maximum = Math.min(
    line.stock,
    product.stock - others.reduce((sum, item) => sum + item.quantity, 0),
  );
  const standard = product.optionGroups.filter(
    (group) => group.kind === "STANDARD",
  );
  const sharedVariant = others.filter((item) =>
    standard.every(
      (group) => item.choices[group.id] === line.choices[group.id],
    ),
  );
  const variant = product.variants?.find(
    (item) =>
      item.valueIds.length === standard.length &&
      standard.every((group) => item.valueIds.includes(line.choices[group.id])),
  );
  if (variant)
    maximum = Math.min(
      maximum,
      variant.stock -
        sharedVariant.reduce((sum, item) => sum + item.quantity, 0),
    );
  for (const group of product.optionGroups) {
    const value = group.values.find(
      (item) => item.id === line.choices[group.id],
    );
    if (!value) continue;
    const consumed = others
      .filter((item) => item.choices[group.id] === value.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    maximum = Math.min(maximum, (value.stock ?? 0) - consumed);
  }
  return Math.max(0, maximum);
}

export function getSelectionTotal(lines: PurchaseSelection[]): number {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}
