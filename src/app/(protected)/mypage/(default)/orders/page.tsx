import { EmptyState } from "@/components/common/empty-state";

/**
 * "주문 및 배송" 마이페이지 내비 목적지. 화면 설계·API 계약이 아직 없어 placeholder만
 * 둔다 — 상품 문의·결제수단 탭과 같은 처리(design.md §7-10·§7-11).
 */
export default function MypageOrdersPage() {
  return (
    <EmptyState
      title="주문 및 배송 조회 기능은 준비 중입니다"
      description="빠른 시일 내에 준비하겠습니다."
    />
  );
}
