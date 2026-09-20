import { mapProductDetailMock } from "@/api/products/detail-mapper";
import type { ProductDetailMockDto } from "@/api/products/detail-validation";
import { productDetailMockDto } from "@/api/products/detail-validation";
import {
  PRODUCT_NOTICES,
  PRODUCT_SHIPPING_INFORMATION,
} from "@/constants/product-information";

import { productCatalogue } from "./catalogue";

/** 기존 목록과 동일한 ID·이름·가격을 사용한다. 모든 상세 확장은 개발용 예시다. */
export function getProductDetailMockDto(
  productId: number,
): ProductDetailMockDto | null {
  const seed = productCatalogue.find((product) => product.id === productId);
  if (!seed) return null;
  const hasOptions = productId !== 102;
  const isSoldOut = productId !== 106 && seed.status === "SOLD_OUT";
  const hasSingleOption = productId === 105;
  const stock = productId === 106 ? null : isSoldOut ? 0 : 12;
  const detail: ProductDetailMockDto["detail"] = {
    images: Array.from({ length: productId === 106 ? 0 : 6 }, (_, index) => ({
      src: `/images/product-placeholder.png?product=${productId}&view=${index + 1}`,
      alt: `${seed.name} ${["정면", "측면", "윗면", "밑면", "표면의 질감", "구성품"][index]}`,
    })),
    artisan:
      productId === 106
        ? null
        : {
            id: seed.artisan.id,
            name: seed.artisan.name,
            image: {
              src: "/images/product-placeholder.png",
              alt: `${seed.artisan.name} 작가`,
            },
            stage: "이수자",
            craft: seed.craftCategory ?? "공예",
            introduction:
              "손끝에 쌓인 시간을 작품에 담습니다. 전통의 깊이와 오늘의 쓰임을 함께 생각하며, 일상에 오래 머무는 아름다움을 만듭니다.",
            href: null,
          },
    rating: productId === 102 ? null : 4.3,
    reviewCount: productId === 102 ? 0 : productId === 101 ? 12 : 5,
    shipping: {
      fee: 3000,
      freeAbove: 100000,
      productionDays: "약 2주일의 제작 기간 소요",
    },
    optionGroups: hasOptions
      ? [
          {
            id: "color",
            label: "색상",
            required: true,
            kind: "STANDARD",
            values: [
              { id: "white", label: "백색", priceDelta: 0, stock },
              {
                id: "cream",
                label: "미색",
                priceDelta: 2000,
                stock: isSoldOut ? 0 : 6,
              },
              { id: "gray", label: "회색 (품절)", priceDelta: 0, stock: 0 },
            ],
          },
          ...(!hasSingleOption
            ? [
                {
                  id: "size",
                  label: "크기",
                  required: true,
                  kind: "STANDARD" as const,
                  values: [
                    { id: "small", label: "소 (15 cm)", priceDelta: 0, stock },
                    {
                      id: "large",
                      label: "대 (20 cm)",
                      priceDelta: 10000,
                      stock: isSoldOut ? 0 : 4,
                    },
                  ],
                },
              ]
            : []),
          ...(productId === 104
            ? [
                {
                  id: "finish",
                  label: "마감",
                  required: true,
                  kind: "STANDARD" as const,
                  values: [
                    { id: "matte", label: "무광", priceDelta: 0, stock },
                    { id: "gloss", label: "유광", priceDelta: 1000, stock },
                  ],
                },
              ]
            : []),
          ...(seed.hasGiftWrap
            ? [
                {
                  id: "gift",
                  label: "선물 포장",
                  required: false,
                  kind: "GIFT" as const,
                  values: [
                    {
                      id: "no-gift",
                      label: "선택 안 함",
                      priceDelta: 0,
                      stock,
                    },
                    {
                      id: "gift-wrap",
                      label: "보자기 포장",
                      priceDelta: 3000,
                      stock,
                    },
                  ],
                },
              ]
            : []),
        ]
      : [],
    variants: null,
    content: [
      { type: "heading", text: "손끝의 정성이 머무는 일상" },
      {
        type: "paragraph",
        text: "정성을 담아 하나씩 완성한 작품입니다. 재료 본연의 질감과 자연스러운 선을 살려, 가까이 둘수록 깊어지는 아름다움을 전합니다.",
      },
      {
        type: "paragraph",
        text: "손으로 만드는 과정에서 크기와 색감에 작은 차이가 생길 수 있습니다. 작품마다 다른 표정도 수공예가 지닌 매력입니다.",
      },
    ],
    specifications: [
      {
        label: "소재",
        content:
          seed.craftCategory === "칠장"
            ? "목재, 천연 옻칠"
            : seed.craftCategory === "유기장"
              ? "유기"
              : "백토, 유약",
      },
      { label: "규격", content: "150 × 150 × 180 mm (소 기준)" },
      { label: "중량", content: "약 600 g" },
      { label: "구성", content: "작품 1점, 작품 안내 카드" },
      { label: "용도", content: "생활 소품 및 실내 장식" },
      { label: "인증", content: "해당 없음" },
      { label: "제조", content: "대한민국" },
    ],
    notices: PRODUCT_NOTICES,
    shippingInformation: PRODUCT_SHIPPING_INFORMATION,
    relatedProducts: productCatalogue
      .filter(
        (product) =>
          product.id !== productId && product.artisan.id === seed.artisan.id,
      )
      .slice(0, 3),
  };
  // 실제 조합별 재고를 검증할 수 있도록 옵션의 데카르트 곱을 fixture로 만든다.
  if (hasOptions && stock !== null) {
    const standardGroups = detail.optionGroups.filter(
      (group) => group.kind === "STANDARD",
    );
    const combinations = standardGroups.reduce<
      { valueIds: string[]; stock: number; priceDelta: number }[]
    >(
      (previous, group) =>
        previous.flatMap((combination) =>
          group.values.map((value) => ({
            valueIds: [...combination.valueIds, value.id],
            stock: Math.min(combination.stock, value.stock ?? 0),
            priceDelta: combination.priceDelta + value.priceDelta,
          })),
        ),
      [{ valueIds: [], stock, priceDelta: 0 }],
    );
    detail.variants = combinations.map((variant) => ({
      ...variant,
      id: `${productId}-${variant.valueIds.join("-")}`,
    }));
  }
  return productDetailMockDto.parse({
    productId,
    artisanId: seed.artisan.id,
    title: seed.name,
    price: seed.price,
    description:
      "고요한 흙의 결을 담아 정성껏 빚어 완성했습니다.\n담백한 형태와 은은한 질감이 어우러져, 오래 곁에 두고 싶은 작품입니다.",
    stock,
    status: productId === 106 ? "ON_SALE" : seed.status,
    thumbnailUrl: seed.thumbnail.variants[0].url,
    detail,
  });
}

export function getProductDetailMock(productId: number) {
  const dto = getProductDetailMockDto(productId);
  return dto ? mapProductDetailMock(dto) : null;
}
