import { Radio, RadioGroup } from "@/components/ui/radio-button";

type PaymentMethod =
  "REALTIME_TRANSFER" | "BANK_TRANSFER" | "CARD" | "TOSS_PAY";

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  REALTIME_TRANSFER: "실시간 계좌이체",
  BANK_TRANSFER: "무통장입금",
  CARD: "신용·체크카드",
  TOSS_PAY: "토스페이",
};

interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface PaymentsMethodProps {
  value?: PaymentMethod;
  onChange?: (value: PaymentMethod) => void;
  /** 무통장입금 안내 박스에 표시할 계좌 정보. 없으면 Figma 플레이스홀더 텍스트를 그대로 보여준다 */
  bankAccountInfo?: BankAccountInfo;
}

const PLACEHOLDER_BANK_ACCOUNT: BankAccountInfo = {
  bankName: "OO은행",
  accountNumber: "000-0000-0000",
  accountHolder: "OOO",
};

/** 결제 화면(CO-1)의 결제 수단 선택 섹션 — 순수 프레젠테이션 컴포넌트. */
export function PaymentsMethod({
  value,
  onChange,
  bankAccountInfo = PLACEHOLDER_BANK_ACCOUNT,
}: PaymentsMethodProps) {
  return (
    <div className="flex flex-col gap-3 text-font-dark">
      <p className="text-title-m">결제 수단</p>
      <RadioGroup
        value={value}
        onValueChange={(next) => onChange?.(next as PaymentMethod)}
      >
        {(
          ["REALTIME_TRANSFER", "BANK_TRANSFER", "CARD", "TOSS_PAY"] as const
        ).map((method) => (
          <Radio
            key={method}
            value={method}
            className="border-b border-border-jade-weak py-3"
          >
            {PAYMENT_METHOD_LABEL[method]}
          </Radio>
        ))}
      </RadioGroup>
      {value === "BANK_TRANSFER" && (
        <div className="bg-fill-neutral-weak px-4 py-2 text-caption text-font-label">
          <p>
            {bankAccountInfo.bankName} {bankAccountInfo.accountNumber} (예금주:{" "}
            {bankAccountInfo.accountHolder})
          </p>
          <p>주문 완료 후 24시간 이내 입금해 주세요.</p>
          <p>입금 기한 내 미입금 시 주문이 자동 취소됩니다.</p>
        </div>
      )}
    </div>
  );
}
