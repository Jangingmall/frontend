import { mapProductDetailMock } from "@/api/products/detail-mapper";
import type { ProductDetailMockDto } from "@/api/products/detail-validation";
import { productDetailMockDto } from "@/api/products/detail-validation";

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
    notices: [
      {
        label: "제품 유의사항",
        content:
          "수작업 특성상 색상, 형태, 크기에 작은 차이가 있을 수 있습니다. 부드러운 천으로 관리하고 강한 충격과 급격한 온도 변화를 피해주세요.",
      },
      {
        label: "품질보증기준",
        content:
          "상품 수령 후 상태를 확인해주세요. 작품의 상태와 관련한 문의는 상품 문의를 통해 남겨주시면 확인 후 안내합니다.",
      },
      {
        label: "A/S 안내",
        content:
          "수선 가능 여부는 작품의 소재와 손상 상태에 따라 달라집니다. 상세한 내용은 작가에게 문의해주세요.",
      },
    ],
    shippingInformation: [
      {
        label: "결제정보",
        content:
          "선택한 옵션과 수량을 확인한 후 주문해주세요. 결제 수단 및 최종 금액은 주문서에서 확인할 수 있습니다.",
      },
      {
        label: "배송정보",
        content:
          "주문 후 제작되는 작품은 제작 완료 후 순차 발송됩니다. 기본 배송비는 3,000원이며 100,000원 이상 구매 시 무료입니다. 도서·산간 지역은 추가 비용이 발생할 수 있습니다.",
      },
      {
        label: "교환 · 반품 · 환불",
        content:
          "작품의 상태, 제작 방식에 따라 교환·반품 가능 여부가 다를 수 있습니다. 접수 전 상품 문의를 통해 안내받아주세요.",
      },
    ],
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
