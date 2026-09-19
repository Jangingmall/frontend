import type { CartOptionDefinition } from "./cart-fixtures";
export function isOptionComplete(
  values: string[],
  definitions: CartOptionDefinition[],
) {
  return definitions.every((definition, index) =>
    (definition.available?.(values) ?? definition.values).includes(
      values[index],
    ),
  );
}
export function updateOptionDraft(
  values: string[],
  index: number,
  value: string,
  definitions: CartOptionDefinition[],
) {
  const next = definitions.map((_, i) => values[i] ?? "");
  next[index] = value;
  for (let i = index + 1; i < definitions.length; i++) {
    if (
      !next[i - 1] ||
      !(definitions[i].available?.(next) ?? definitions[i].values).includes(
        next[i],
      )
    )
      next[i] = "";
  }
  return next;
}
