import { Button } from "@/components/ui/button";
import { Radio } from "@/components/ui/radio-button";
import { formatPhone } from "@/constants/phone";
import { cn } from "@/lib/utils";
import type { Address } from "@/types/member";

/**
 * 배송지 카드(Figma ID-3). 순수 표시 컴포넌트 — `api`·`queries`에 의존하지 않는다
 * (architecture.md §6). 마이페이지 배송지 탭과 체크아웃 배송지 선택 모달(CO-2, 후속 작업)이
 * 함께 재사용한다.
 *
 * 기본 배송지 선택은 개별 콜백이 아니라 카드를 감싸는 `RadioGroup`(호출부, `AddressesTab`)이
 * 책임진다 — Figma가 각 카드 헤더를 라디오 선택지로 그렸고(`Radio` prim은 그룹 컨텍스트로만
 * 선택 상태를 가진다), 여러 카드 중 하나만 고르는 흐름과도 자연스럽게 맞는다.
 */
interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
}

function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  return (
    <div
      data-slot="address-card"
      className={cn(
        "flex w-64 shrink-0 flex-col overflow-hidden rounded-sm border bg-bg-default shadow-nav",
        address.isDefault
          ? "border-border-jade-fill"
          : "border-border-neutral-subtle",
      )}
    >
      <label className="flex cursor-pointer items-center justify-end gap-2 bg-fill-neutral-weak px-3 py-2">
        <span
          className={cn(
            "text-body-s text-font-dark",
            address.isDefault && "font-bold",
          )}
        >
          {address.isDefault ? "기본 주소지" : "기본 주소지로 설정"}
        </span>
        <Radio value={address.id} />
      </label>

      <div className="flex flex-col gap-4 p-4">
        <AddressField label="받는 사람" value={address.recipientName} />
        <AddressField label="연락처" value={formatPhone(address.phone)} />
        <AddressField label="주소" value={address.address1} />
        <AddressField label="상세주소" value={address.address2} reserveLines />

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="s"
            className="w-full"
            onClick={() => onEdit(address)}
          >
            주소지 수정하기
          </Button>
          <Button
            type="button"
            variant="outline"
            size="s"
            className="w-full"
            onClick={() => onDelete(address)}
          >
            주소지 삭제하기
          </Button>
        </div>
      </div>
    </div>
  );
}

/** 카드 안 라벨+값 한 쌍. `reserveLines`는 "상세주소"처럼 2줄까지 미리 높이를 잡아 카드
 * 높이가 값 길이에 따라 들쭉날쭉해지지 않게 한다(Figma `min-h-[36px]`). */
function AddressField({
  label,
  value,
  reserveLines = false,
}: {
  label: string;
  value: string;
  reserveLines?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 text-body-s">
      <p className="text-body-s-b text-font-dark">{label}</p>
      <p className={cn("text-font-dark-secondary", reserveLines && "min-h-9")}>
        {value}
      </p>
    </div>
  );
}

export { AddressCard };
export type { AddressCardProps };
