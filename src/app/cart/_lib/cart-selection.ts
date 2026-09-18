import type { CartPreviewLine } from "@/types/purchase-preview";
export const getPurchasableLines = (lines: CartPreviewLine[]) =>
  lines.filter((line) => !line.soldOut);
export const getSelectedAmount = (lines: CartPreviewLine[]) =>
  getPurchasableLines(lines)
    .filter((line) => line.selected)
    .reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
export const setSelection = (
  lines: CartPreviewLine[],
  selected: boolean,
  artisanId?: number,
) =>
  lines.map((line) =>
    line.soldOut
      ? { ...line, selected: false }
      : artisanId === undefined || line.artisanId === artisanId
        ? { ...line, selected }
        : line,
  );
export const changeQuantity = (
  lines: CartPreviewLine[],
  id: string,
  quantity: number,
) =>
  lines.map((line) =>
    line.lineId === id && !line.soldOut && Number.isFinite(quantity)
      ? {
          ...line,
          quantity: Math.max(
            1,
            Math.min(line.maxQuantity, Math.trunc(quantity)),
          ),
        }
      : line,
  );
export interface RemovedLine {
  line: CartPreviewLine;
  index: number;
}
export function removeLines(lines: CartPreviewLine[], ids: string[]) {
  return {
    remaining: lines.filter((line) => !ids.includes(line.lineId)),
    snapshot: lines.flatMap((line, index) =>
      ids.includes(line.lineId) ? [{ line, index }] : [],
    ),
  };
}
export function restoreLines(
  lines: CartPreviewLine[],
  snapshot: RemovedLine[],
) {
  const restored = [...lines];
  for (const { line, index } of snapshot)
    if (!restored.some((item) => item.lineId === line.lineId))
      restored.splice(index, 0, line);
  return restored;
}
