import type { ProductDetailMockDto } from "@/api/products/detail-validation";

export const teacupDemo: ProductDetailMockDto = {
  productId: 900002,
  artisanId: 900002,
  title: "청자 분청 찻잔",
  price: 120000,
  stock: 30,
  status: "ON_SALE",
  productionPeriodDays: 28,
  thumbnailUrl: "/images/chatbot-demo/celadon-teacup.png",
  description:
    "고요한 흙의 결을 담아 빚어낸 청자 분청 찻잔입니다.\n담백한 형태와 은은한 질감이 어우러져 일상 속 차 한 잔의 순간을 더욱 편안하게 만들어줍니다.\n손끝으로 하나하나 다듬고 구워내 자연스러운 표면과 깊이 있는 색감을 완성했습니다.",
  detail: {
    images: [
      {
        src: "/images/chatbot-demo/celadon-teacup.png",
        alt: "청자 분청 찻잔 상세 사진 1",
      },
      {
        src: "/images/chatbot-demo/teacup-1.png",
        alt: "청자 분청 찻잔 상세 사진 2",
      },
      {
        src: "/images/chatbot-demo/teacup-2.png",
        alt: "청자 분청 찻잔 상세 사진 3",
      },
      {
        src: "/images/chatbot-demo/teacup-3.png",
        alt: "청자 분청 찻잔 상세 사진 4",
      },
      {
        src: "/images/chatbot-demo/teacup-4.png",
        alt: "청자 분청 찻잔 상세 사진 5",
      },
      {
        src: "/images/chatbot-demo/teacup-5.png",
        alt: "청자 분청 찻잔 상세 사진 6",
      },
    ],
    artisan: {
      id: 900002,
      name: "이청청",
      image: {
        src: "/images/chatbot-demo/teacup-artisan.png",
        alt: "이청청 장인",
      },
      stage: "보유자",
      craft: "청자",
      introduction:
        "35년 동안 부산에서 청자만을 제작해온 국가무형문화유산 보유자 이청청 장인입니다.\n수많은 정성 어린 손길과 섬세한 기술로 전통의 아름다움을 현대적으로 계승하고 있습니다.",
      href: null,
    },
    rating: 5,
    reviewCount: 5,
    shipping: {
      fee: 3000,
      freeAbove: 100000,
      productionDays: "약 4주간의 제작 기간 소요",
    },
    optionGroups: [
      {
        id: "type",
        label: "찻잔 종류",
        required: true,
        kind: "STANDARD",
        values: [
          {
            id: "type-0",
            label: "찻잔 단품",
            priceDelta: 0,
            stock: 30,
          },
          {
            id: "type-1",
            label: "찻잔 + 꽃잎 찻받침 세트",
            priceDelta: 45000,
            stock: 30,
          },
          {
            id: "type-2",
            label: "2인 세트 - 찻잔2개 + 꽃잎 찻받침2개",
            priceDelta: 90000,
            stock: 30,
          },
        ],
      },
      {
        id: "color",
        label: "색상",
        required: true,
        kind: "STANDARD",
        values: [
          {
            id: "color-0",
            label: "청자색",
            priceDelta: 0,
            stock: 30,
          },
          {
            id: "color-1",
            label: "유백색",
            priceDelta: 5000,
            stock: 30,
          },
          {
            id: "color-2",
            label: "회청색",
            priceDelta: 5000,
            stock: 30,
          },
        ],
      },
      {
        id: "size",
        label: "사이즈",
        required: true,
        kind: "STANDARD",
        values: [
          {
            id: "size-0",
            label: "소 - 80ml",
            priceDelta: 0,
            stock: 30,
          },
          {
            id: "size-1",
            label: "중 - 150ml",
            priceDelta: 5000,
            stock: 30,
          },
        ],
      },
      {
        id: "gift",
        label: "선물 옵션",
        required: true,
        kind: "GIFT",
        values: [
          {
            id: "gift-0",
            label: "포장 없음",
            priceDelta: 0,
            stock: 30,
          },
          {
            id: "gift-1",
            label: "전통 보자기 포장",
            priceDelta: 5000,
            stock: 30,
          },
          {
            id: "gift-2",
            label: "고급 한지 박스 포장",
            priceDelta: 10000,
            stock: 30,
          },
          {
            id: "gift-3",
            label: "나무 선물 상자 포장",
            priceDelta: 20000,
            stock: 30,
          },
        ],
      },
    ],
    variants: [
      {
        valueIds: ["type-0", "color-0", "size-0"],
        stock: 30,
        priceDelta: 0,
        id: "900002-0",
      },
      {
        valueIds: ["type-0", "color-0", "size-1"],
        stock: 30,
        priceDelta: 5000,
        id: "900002-1",
      },
      {
        valueIds: ["type-0", "color-1", "size-0"],
        stock: 30,
        priceDelta: 5000,
        id: "900002-2",
      },
      {
        valueIds: ["type-0", "color-1", "size-1"],
        stock: 30,
        priceDelta: 10000,
        id: "900002-3",
      },
      {
        valueIds: ["type-0", "color-2", "size-0"],
        stock: 30,
        priceDelta: 5000,
        id: "900002-4",
      },
      {
        valueIds: ["type-0", "color-2", "size-1"],
        stock: 30,
        priceDelta: 10000,
        id: "900002-5",
      },
      {
        valueIds: ["type-1", "color-0", "size-0"],
        stock: 30,
        priceDelta: 45000,
        id: "900002-6",
      },
      {
        valueIds: ["type-1", "color-0", "size-1"],
        stock: 30,
        priceDelta: 50000,
        id: "900002-7",
      },
      {
        valueIds: ["type-1", "color-1", "size-0"],
        stock: 30,
        priceDelta: 50000,
        id: "900002-8",
      },
      {
        valueIds: ["type-1", "color-1", "size-1"],
        stock: 30,
        priceDelta: 55000,
        id: "900002-9",
      },
      {
        valueIds: ["type-1", "color-2", "size-0"],
        stock: 30,
        priceDelta: 50000,
        id: "900002-10",
      },
      {
        valueIds: ["type-1", "color-2", "size-1"],
        stock: 30,
        priceDelta: 55000,
        id: "900002-11",
      },
      {
        valueIds: ["type-2", "color-0", "size-0"],
        stock: 30,
        priceDelta: 90000,
        id: "900002-12",
      },
      {
        valueIds: ["type-2", "color-0", "size-1"],
        stock: 30,
        priceDelta: 95000,
        id: "900002-13",
      },
      {
        valueIds: ["type-2", "color-1", "size-0"],
        stock: 30,
        priceDelta: 95000,
        id: "900002-14",
      },
      {
        valueIds: ["type-2", "color-1", "size-1"],
        stock: 30,
        priceDelta: 100000,
        id: "900002-15",
      },
      {
        valueIds: ["type-2", "color-2", "size-0"],
        stock: 30,
        priceDelta: 95000,
        id: "900002-16",
      },
      {
        valueIds: ["type-2", "color-2", "size-1"],
        stock: 30,
        priceDelta: 100000,
        id: "900002-17",
      },
    ],
    content: [
      {
        type: "image",
        image: {
          src: "/images/chatbot-demo/teacup-detail-clean.png",
          alt: "청자 분청 찻잔 상품 상세 이미지",
          width: 774,
          height: 3535,
        },
      },
    ],
    specifications: [
      {
        label: "소재",
        content: "청자토, 분청 장석유약",
      },
      {
        label: "규격",
        content: "85 × 85 × H65mm (찻받침 120 × 120 × H15mm)",
      },
      {
        label: "중량",
        content: "165g (찻잔 기준 / 찻받침 포함 240g)",
      },
      {
        label: "구성",
        content: "찻잔 1개 + 찻받침 1개",
      },
      {
        label: "용도",
        content: "녹차·우롱차·보이차 등 전통차 음용",
      },
      {
        label: "인증",
        content: "장인 보유자",
      },
      {
        label: "제조",
        content: "대한민국",
      },
    ],
    notices: [],
    shippingInformation: [],
    relatedProducts: [],
  },
};
