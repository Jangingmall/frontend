import { CheckoutField } from "./CheckoutField";
export function PhoneFields({
  owner,
  readOnly = false,
}: {
  owner: "customer" | "recipient";
  readOnly?: boolean;
}) {
  const label = owner === "customer" ? "주문자" : "수령인";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
      <CheckoutField
        name={`${owner}PhoneFirst`}
        label={`${label} 휴대전화 앞자리`}
        type="tel"
        readOnly={readOnly}
      />
      <span className="pt-2">-</span>
      <CheckoutField
        name={`${owner}PhoneMiddle`}
        label={`${label} 휴대전화 중간자리`}
        placeholder="0000"
        type="tel"
        readOnly={readOnly}
      />
      <span className="pt-2">-</span>
      <CheckoutField
        name={`${owner}PhoneLast`}
        label={`${label} 휴대전화 끝자리`}
        placeholder="0000"
        type="tel"
        readOnly={readOnly}
      />
    </div>
  );
}
