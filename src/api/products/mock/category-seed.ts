import type { z } from "zod";

import type {
  backendCategoriesDto,
  backendSubcategoriesDto,
} from "@/api/products/backend-validation";

type BackendCategoriesDto = z.infer<typeof backendCategoriesDto>;
type BackendSubcategoriesDto = z.infer<typeof backendSubcategoriesDto>;

/**
 * 쓰임 분류 시드 — 백엔드 시드(`V7__seed_data.sql`, 대분류 7·소분류 56)와 같은 값·ID·응답 형태다.
 * MSW `GET /api/products/categories`·`/subcategories`가 그대로 돌려줘 실서버 모드와 같은
 * 경로(`mapBackendProductCategories`)로 처리된다. 표시 이름의 가운뎃점 앞뒤 공백 정규화는
 * 화면 계층(`lib/gnb-categories.ts`)이 한다.
 */
export const backendCategoryDtos: BackendCategoriesDto = [
  { categoryId: 1, name: "키친·다이닝" },
  { categoryId: 2, name: "홈·인테리어" },
  { categoryId: 3, name: "패션·액세서리" },
  { categoryId: 4, name: "데스크·문구" },
  { categoryId: 5, name: "패브릭·생활" },
  { categoryId: 6, name: "아트·컬렉션" },
  { categoryId: 7, name: "식품·전통주" },
];

export const backendSubcategoryDtos: BackendSubcategoriesDto = [
  { subcategoryId: 1, categoryId: 1, name: "다기·찻잔" },
  { subcategoryId: 2, categoryId: 1, name: "그릇·접시" },
  { subcategoryId: 3, categoryId: 1, name: "수저·젓가락" },
  { subcategoryId: 4, categoryId: 1, name: "컵·술병·술잔" },
  { subcategoryId: 5, categoryId: 1, name: "소반·쟁반" },
  { subcategoryId: 6, categoryId: 1, name: "칼·도마" },
  { subcategoryId: 7, categoryId: 1, name: "항아리·옹기" },
  { subcategoryId: 8, categoryId: 1, name: "냄비·솥" },
  { subcategoryId: 9, categoryId: 1, name: "제기" },
  { subcategoryId: 10, categoryId: 2, name: "조명" },
  { subcategoryId: 11, categoryId: 2, name: "수납함·보석함" },
  { subcategoryId: 12, categoryId: 2, name: "화병·꽃" },
  { subcategoryId: 13, categoryId: 2, name: "시계·벽장식" },
  { subcategoryId: 14, categoryId: 2, name: "발·가림막" },
  { subcategoryId: 15, categoryId: 2, name: "가구" },
  { subcategoryId: 16, categoryId: 2, name: "장석·손잡이" },
  { subcategoryId: 17, categoryId: 3, name: "반지·귀걸이" },
  { subcategoryId: 18, categoryId: 3, name: "목걸이·팔찌" },
  { subcategoryId: 19, categoryId: 3, name: "노리개·브로치" },
  { subcategoryId: 20, categoryId: 3, name: "머리핀·비녀" },
  { subcategoryId: 21, categoryId: 3, name: "스카프·머플러" },
  { subcategoryId: 22, categoryId: 3, name: "가방·파우치" },
  { subcategoryId: 23, categoryId: 3, name: "지갑·카드지갑" },
  { subcategoryId: 24, categoryId: 3, name: "키링·열쇠고리" },
  { subcategoryId: 25, categoryId: 3, name: "부채" },
  { subcategoryId: 26, categoryId: 3, name: "한복·생활한복" },
  { subcategoryId: 27, categoryId: 3, name: "갓·모자" },
  { subcategoryId: 28, categoryId: 3, name: "망건·머리장식" },
  { subcategoryId: 29, categoryId: 4, name: "붓·먹·벼루" },
  { subcategoryId: 30, categoryId: 4, name: "한지·편지지" },
  { subcategoryId: 31, categoryId: 4, name: "볼펜·만년필" },
  { subcategoryId: 32, categoryId: 4, name: "명함집" },
  { subcategoryId: 33, categoryId: 4, name: "필통·펜꽂이" },
  { subcategoryId: 34, categoryId: 5, name: "방석·보료" },
  { subcategoryId: 35, categoryId: 5, name: "침구·이불" },
  { subcategoryId: 36, categoryId: 5, name: "테이블보·러너" },
  { subcategoryId: 37, categoryId: 5, name: "보자기·복주머니" },
  { subcategoryId: 38, categoryId: 5, name: "손수건" },
  { subcategoryId: 39, categoryId: 5, name: "앞치마·주방패브릭" },
  { subcategoryId: 40, categoryId: 5, name: "돗자리·왕골" },
  { subcategoryId: 41, categoryId: 5, name: "자수 액자·소품" },
  { subcategoryId: 42, categoryId: 6, name: "액자·그림" },
  { subcategoryId: 43, categoryId: 6, name: "병풍·족자" },
  { subcategoryId: 44, categoryId: 6, name: "서예·서각" },
  { subcategoryId: 45, categoryId: 6, name: "목조각·조형" },
  { subcategoryId: 46, categoryId: 6, name: "전통인형·탈" },
  { subcategoryId: 47, categoryId: 6, name: "장도·전통무구" },
  { subcategoryId: 48, categoryId: 6, name: "전통악기" },
  { subcategoryId: 49, categoryId: 6, name: "불교용품" },
  { subcategoryId: 50, categoryId: 6, name: "소장품" },
  { subcategoryId: 51, categoryId: 7, name: "전통주" },
  { subcategoryId: 52, categoryId: 7, name: "차" },
  { subcategoryId: 53, categoryId: 7, name: "장·장아찌" },
  { subcategoryId: 54, categoryId: 7, name: "김치" },
  { subcategoryId: 55, categoryId: 7, name: "떡·한과" },
  { subcategoryId: 56, categoryId: 7, name: "궁중음식·선물세트" },
];
