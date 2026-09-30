import { cn } from "@/lib/utils";

/**
 * 상품 목록(`/products`) 카드 그리드 클래스. 결과 그리드와 로딩 스켈레톤이 같은 열 수·간격을 쓴다.
 *   - 카테고리 목록(PL-2/PL-3): 시안이 카드 폭을 고정하고 열 간격은 양끝 정렬로 남긴다.
 *     mobile 160×2 / md 220×3 / lg 242×3 / xl 242×4 / 2xl 260×4, 행 간격 24(mobile 8).
 *   - 카테고리 없는 목록(PL-1): 시안이 없고 좌측 필터가 없어 본문이 더 넓다. 고정 폭을 쓰면
 *     lg 이상에서 열 간격이 100px 안팎으로 벌어지므로 본문 폭을 채우는 유동 그리드로 두고
 *     열 수·간격만 맞춘다.
 */
export function catalogGridClassName(isCategoryList: boolean) {
  return cn(
    "grid gap-y-2 md:gap-y-6",
    isCategoryList
      ? "grid-cols-[repeat(2,minmax(0,10rem))] justify-between md:grid-cols-[repeat(3,minmax(0,13.75rem))] lg:grid-cols-[repeat(3,minmax(0,15.125rem))] xl:grid-cols-[repeat(4,minmax(0,15.125rem))] 2xl:grid-cols-[repeat(4,minmax(0,16.25rem))]"
      : "grid-cols-2 gap-x-2 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4",
  );
}
