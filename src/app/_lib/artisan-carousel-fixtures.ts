/**
 * 홈 "장인관" 캐러셀 더미 데이터.
 *
 * `artisan` 도메인 api/타입은 만들지 않기로 했다(로드맵 "범위 밖" 절) — 이 섹션은 디자인만
 * 유지하고 실제 이동은 없앤다(design.md §1-1). 6건 전부 가상 인물이고, Figma 예시(자개·41년·
 * 통영)를 그대로 반복하면 특정 실존 장인을 연상시킬 수 있어 공예 분야를 섞어 새로 채웠다.
 */
export interface ArtisanCarouselItem {
  id: string;
  /** Figma `badge-artisan` 두 번째 배지: 「보유자」/「이수자」(첫 배지 「국가무형유산」은 공통 고정값). */
  badge: string;
  headline: string;
  description: string;
  experience: string;
  artworkCount: string;
  workshop: string;
}

const DESCRIPTION =
  "나라가 인정한 손끝에서 나온 물건입니다. 누가 어떻게 만들었는지, 만든 이가 직접 확인한 이야기와 함께 보내 드립니다.";

export const ARTISAN_CAROUSEL_ITEMS: readonly ArtisanCarouselItem[] = [
  {
    id: "artisan-1",
    badge: "보유자",
    headline: "그릇 하나에 백 번의 손길을 얹습니다",
    description: DESCRIPTION,
    experience: "32년",
    artworkCount: "총 84점",
    workshop: "여주",
  },
  {
    id: "artisan-2",
    badge: "이수자",
    headline: "옻칠 한 겹마다 계절을 기다립니다",
    description: DESCRIPTION,
    experience: "18년",
    artworkCount: "총 47점",
    workshop: "원주",
  },
  {
    id: "artisan-3",
    badge: "보유자",
    headline: "무쇠에 불을 먹여 날을 세웁니다",
    description: DESCRIPTION,
    experience: "45년",
    artworkCount: "총 132점",
    workshop: "안성",
  },
  {
    id: "artisan-4",
    badge: "이수자",
    headline: "한 올 한 올 삼베에 바람을 짭니다",
    description: DESCRIPTION,
    experience: "12년",
    artworkCount: "총 29점",
    workshop: "나주",
  },
  {
    id: "artisan-5",
    badge: "보유자",
    headline: "닥나무 껍질을 백 번 씻어 종이를 냅니다",
    description: DESCRIPTION,
    experience: "27년",
    artworkCount: "총 63점",
    workshop: "전주",
  },
  {
    id: "artisan-6",
    badge: "이수자",
    headline: "나무의 결을 따라 선을 눕힙니다",
    description: DESCRIPTION,
    experience: "9년",
    artworkCount: "총 21점",
    workshop: "담양",
  },
];
