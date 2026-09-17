import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/ui/icons";

interface OrderExpandToggleProps {
  /** "총 N건 주문 펼쳐보기" */
  itemCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * 복수 상품 주문의 펼치기/접기 토글(Figma "flip-btn"). 텍스트는 접힘·펼침 모두 동일하고
 * 방향 아이콘만 반전된다. 실제 펼침/접힘 상태 관리와 그에 따라 카드를 몇 개 보여줄지
 * 조립하는 로직은 이 컴포넌트의 책임이 아니다 — 렌더링만 담당한다.
 */
export function OrderExpandToggle({
  itemCount,
  isExpanded,
  onToggle,
}: OrderExpandToggleProps) {
  const Icon = isExpanded ? ChevronUpIcon : ChevronDownIcon;

  return (
    <Button
      variant="outline"
      size="l"
      className="w-full"
      aria-expanded={isExpanded}
      onClick={onToggle}
    >
      총 {itemCount}건 주문 펼쳐보기
      <Icon aria-hidden />
    </Button>
  );
}
