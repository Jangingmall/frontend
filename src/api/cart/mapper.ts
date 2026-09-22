import type { Cart } from "@/types/cart";
import type { ImageVariant } from "@/types/image";

import type { CartDto } from "./validation";
export function mapCart(dto: CartDto): Cart {
  return {
    ...dto,
    sections: dto.sections.map(
      ({ artisanId, artisanName, shippingFee, freeShippingThreshold }) => ({
        artisanId,
        artisanName,
        shippingFee,
        freeShippingThreshold,
      }),
    ),
    lines: dto.sections.flatMap((section) =>
      section.items.map((item) => ({
        lineId: String(item.cartItemId),
        productId: item.productId,
        artisanId: section.artisanId,
        artisanName: section.artisanName,
        productName: item.productName,
        thumbnail: {
          imageId: `cart-${item.productId}`,
          variants: item.thumbnail
            .filter(
              (image): image is typeof image & ImageVariant =>
                [320, 640, 1280].includes(image.width) &&
                image.format === "webp",
            )
            .map(({ width, url, format }) => ({ width, url, format })),
        },
        options: [
          ...item.selectedOptions.map(
            (option) => `${option.name}: ${option.choiceName}`,
          ),
          ...item.textInputs.map((input) => `${input.name}: ${input.text}`),
        ],
        selectedOptions: item.selectedOptions.map(
          ({ optionGroupId, choiceId }) => ({ optionGroupId, choiceId }),
        ),
        textInputs: item.textInputs.map(({ optionGroupId, text }) => ({
          optionGroupId,
          text,
        })),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        maxQuantity: Infinity,
        soldOut: item.soldOut,
        selected: item.selected,
      })),
    ),
  };
}
