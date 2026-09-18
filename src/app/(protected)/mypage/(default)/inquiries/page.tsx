import { EmptyState } from "@/components/common/empty-state";

/**
 * "상품 문의" 마이페이지 내비 목적지. Route Map·로드맵 어디에도 화면 설계·API 계획이 없어
 * (BE에도 회원별 문의 내역 조회 기능 자체가 없다) placeholder만 둔다 — 결제수단 탭과 같은
 * 처리(design.md §7-10·§7-11).
 */
export default function MypageInquiriesPage() {
  return (
    <EmptyState
      title="문의 내역 조회 기능은 준비 중입니다"
      description="빠른 시일 내에 준비하겠습니다."
    />
  );
}
