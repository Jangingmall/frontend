/**
 * IA CM-2 전체 카테고리 메가패널의 대분류("쓰임" 축, 키친·다이닝 등 7종)·소분류 데이터.
 *
 * BE에는 이 축이 없다 — `/api/products/categories(/main)`·`/api/products/subcategories`는
 * 전부 국가무형유산 "종목" 축(도자공예 등)이고, IA는 이 둘을 명시적으로 별개 축이라 못박는다
 * (`docs/api-contract.md` §5). 그래서 `api/`·`queries/` 계층 없이 정적 상수로 둔다
 * (`temp/tasks/T-06-category-mega-panel/design.md` §0).
 *
 * 출처: Figma GUI 파일(`ZSESuanQor1IT8mr67JjmI`) `599:321` 페이지의
 * `GNB_'전체 카테고리' → '<대분류>' hover, pressed` 프레임 7개. 오탈자 교정("파우지"→"파우치",
 * "짱아찌"→"장아찌"), 표기 통일("패션·악세사리"→"패션·액세서리"), "명함집필통·펜꽂이"를
 * "명함집"·"필통 · 펜꽂이" 두 항목으로 분리 반영.
 */

export interface GnbSubcategory {
  name: string;
}

export interface GnbCategory {
  name: string;
  subcategories: GnbSubcategory[];
}

/**
 * 대/소분류 표시 이름 → `/products?category=` 값. "키친 · 다이닝" → "키친-다이닝".
 * 이름·코드를 따로 관리하면 여러 항목 중 일부가 어긋날 여지가 생겨 이름에서 기계적으로
 * 파생시킨다.
 */
export function toGnbCategoryCode(name: string): string {
  return name.trim().replace(/\s*·\s*/g, "-");
}

export const GNB_CATEGORIES: GnbCategory[] = [
  {
    name: "키친 · 다이닝",
    subcategories: [
      { name: "다기 · 찻잔" },
      { name: "그릇 · 접시" },
      { name: "수저 · 젓가락" },
      { name: "컵 · 술병 · 술잔" },
      { name: "소반 · 쟁반" },
      { name: "칼 · 도마" },
      { name: "항아리 · 옹기" },
      { name: "냄비 · 솥" },
      { name: "제기" },
    ],
  },
  {
    name: "홈 · 인테리어",
    subcategories: [
      { name: "조명" },
      { name: "수납함 · 보석함" },
      { name: "화병 · 꽃" },
      { name: "시계 · 벽장식" },
      { name: "발 · 가림막" },
      { name: "가구" },
      { name: "장석 · 손잡이" },
    ],
  },
  {
    name: "패션 · 액세서리",
    subcategories: [
      { name: "반지 · 귀걸이" },
      { name: "목걸이 · 팔찌" },
      { name: "노리개 · 브로치" },
      { name: "머리핀 · 비녀" },
      { name: "스카프 · 머플러" },
      { name: "가방 · 파우치" },
      { name: "지갑 · 카드지갑" },
      { name: "키링 · 열쇠고리" },
      { name: "부채" },
      { name: "한복 · 생활한복" },
      { name: "갓 · 모자" },
      { name: "망건 · 머리장식" },
    ],
  },
  {
    name: "데스크 · 문구",
    subcategories: [
      { name: "붓 · 먹 · 벼루" },
      { name: "한지 · 편지지" },
      { name: "볼펜 · 만년필" },
      { name: "명함집" },
      { name: "필통 · 펜꽂이" },
    ],
  },
  {
    name: "패브릭 · 생활",
    subcategories: [
      { name: "방석 · 보료" },
      { name: "침구 · 이불" },
      { name: "테이블보 · 러너" },
      { name: "보자기 · 복주머니" },
      { name: "손수건" },
      { name: "앞치마 · 주방패브릭" },
      { name: "돗자리 · 왕골" },
      { name: "자수 액자 · 소품" },
    ],
  },
  {
    name: "아트 · 컬렉션",
    subcategories: [
      { name: "액자 · 그림" },
      { name: "병풍 · 족자" },
      { name: "서예 · 서각" },
      { name: "목조각 · 조형" },
      { name: "전통인형 · 탈" },
      { name: "장도 · 전통무구" },
      { name: "전통악기" },
      { name: "불교용품" },
      { name: "소장품" },
    ],
  },
  {
    name: "식품 · 전통주",
    subcategories: [
      { name: "전통주" },
      { name: "차" },
      { name: "장아찌" },
      { name: "김치" },
      { name: "떡 · 한과" },
      { name: "궁중음식 · 선물세트" },
    ],
  },
];
