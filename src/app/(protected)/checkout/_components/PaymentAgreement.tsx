import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
interface PaymentAgreementProps {
  agreed: boolean;
  disabled?: boolean;
  submitLabel?: string;
  onAgreedChange: (checked: boolean) => void;
  onDetails: () => void;
}
export function PaymentAgreement({
  agreed,
  disabled = false,
  submitLabel = "결제하기",
  onAgreedChange,
  onDetails,
}: PaymentAgreementProps) {
  return (
    <section className="space-y-3 rounded-xs bg-bg-default p-6 shadow-floating">
      <h2 className="text-title-m">이용 및 정보 제공 약관</h2>
      <p className="text-body-s">
        결제 전 이용 정보 제공 약관 등의 내용을 확인하였으며 이에 동의합니다.
      </p>
      <div className="flex items-center justify-between">
        <span className="text-body-s-b">이용약관</span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onDetails}
          className="text-caption text-font-dark-weak underline"
        >
          자세히
        </Button>
      </div>
      <Checkbox
        disabled={disabled}
        checked={agreed}
        onCheckedChange={onAgreedChange}
      >
        약관에 동의합니다.
      </Checkbox>
      <Button
        type="submit"
        size="l"
        className="w-full"
        disabled={!agreed || disabled}
      >
        {submitLabel}
      </Button>
    </section>
  );
}
