import { EmptyState } from "@/components/common/empty-state";

/**
 * 마이페이지 대시보드(`/mypage`, Figma MY-1). 적립금·구매등급 제도가 정책 미확정이고
 * 개발 순번도 없어(routing-and-auth.md §9) 실제 대시보드 대신 placeholder만 둔다 — 상품
 * 문의·결제수단 탭과 같은 처리(design.md §7-10·§7-11). "회원 정보 수정" 뒤로가기가 이
 * 경로로 돌아오므로, 셸만 먼저 갖춰 목적지 자체는 존재하게 한다.
 */
export default function MypagePage() {
  return (
    <EmptyState
      title="마이페이지 대시보드는 준비 중입니다"
      description="빠른 시일 내에 준비하겠습니다."
    />
  );
}
