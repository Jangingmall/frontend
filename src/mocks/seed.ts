import type { ImageRef, ImageVariantWidth } from "@/types/image";

/**
 * 목업 픽스처를 만들 때 여러 도메인이 공유하는 결정적 빌더. 랜덤·시간에 의존하지
 * 않으므로 같은 입력 → 항상 같은 출력이다(테스트 assert·시각 리뷰 안정).
 * 도메인 고유 데이터는 각 `api/{domain}/mock/fixtures.ts`에 두고, 여기서는
 * 여러 도메인이 반복해 쓰는 조각만 제공한다.
 */

/** 3종 고정 이미지 variant 폭. (docs/api-contract.md §2.2) */
const IMAGE_VARIANT_WIDTHS = [
  320, 640, 1280,
] as const satisfies readonly ImageVariantWidth[];

/**
 * 순번 기반 이미지 id. 실제 백엔드처럼 `image_` + 26자 Base32(ULID 형태) — 앞 10자는
 * 임의 고정 타임스탬프부, 뒤 16자는 순번 인코딩. 시간·랜덤에 의존하지 않아 실행마다
 * 동일하다. 스펙 완전 준수 ULID는 아니고 형태만 맞춘 결정적 값이다.
 * (docs/api-contract.md §2.2 — imageId 는 ULID)
 */
const SEED_ULID_TIME = "01JQ000000"; // 고정 10자(타임스탬프 자리)

export function seedImageId(seq: number): string {
  const tail = seq.toString(32).toUpperCase().padStart(16, "0");
  return `image_${SEED_ULID_TIME}${tail}`;
}

/**
 * 320/640/1280 webp 3-variant 이미지 참조. 도메인 픽스처의 로컬 이미지 빌더를 대체한다.
 * 반환 타입은 `ImageRef`를 `satisfies`로만 검증한다 — 명시 annotation을 붙이면
 * `.passthrough()` DTO(인덱스 시그니처 보유)에 대입할 때 nominal interface가 걸린다.
 */
export function seedImageRef(seq: number) {
  const imageId = seedImageId(seq);
  return {
    imageId,
    variants: IMAGE_VARIANT_WIDTHS.map((width) => ({
      width,
      url: `https://cdn.example.com/${imageId}/${width}.webp`,
      format: "webp" as const,
    })),
  } satisfies ImageRef;
}

/** `1..n` 정수 배열. 목록 픽스처를 반복 생성할 때 쓴다. */
export function range(n: number): number[] {
  return Array.from({ length: Math.max(0, n) }, (_, index) => index + 1);
}
