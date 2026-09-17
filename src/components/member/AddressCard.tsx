import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Address } from "@/types/member";

/**
 * 배송지 카드. 순수 표시 컴포넌트 — `api`·`queries`에 의존하지 않는다(architecture.md §6).
 * 마이페이지 배송지 탭과 체크아웃 배송지 선택 모달(CO-2, 후속 작업)이 함께 재사용한다.
 */
interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  /** 이미 기본 배송지면 액션 자체를 안 보여준다(호출부가 조건 분기 안 해도 되게). */
  onSetDefault: (address: Address) => void;
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  return (
    <div
      data-slot="address-card"
      className="flex flex-col gap-4 border border-border-neutral-subtle p-6"
    >
      {address.isDefault && <Badge variant="jade">기본 배송지</Badge>}

      <dl className="grid grid-cols-[5.625rem_1fr] gap-y-2 text-body-s">
        <dt className="text-font-dark-subtle">받는 사람</dt>
        <dd className="text-font-dark">{address.recipientName}</dd>
        <dt className="text-font-dark-subtle">연락처</dt>
        <dd className="text-font-dark">{address.phone}</dd>
        <dt className="text-font-dark-subtle">주소</dt>
        <dd className="text-font-dark">{address.address1}</dd>
        <dt className="text-font-dark-subtle">상세주소</dt>
        <dd className="text-font-dark">{address.address2}</dd>
      </dl>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onEdit(address)}
        >
          배송지 수정하기
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onDelete(address)}
        >
          배송지 삭제하기
        </Button>
        {!address.isDefault && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onSetDefault(address)}
          >
            기본 배송지로 설정
          </Button>
        )}
      </div>
    </div>
  );
}

export { AddressCard };
export type { AddressCardProps };
