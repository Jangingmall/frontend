import { CheckoutField } from "./CheckoutField";
import { CheckoutFieldRow } from "./CheckoutFieldRow";
import { PhoneFields } from "./PhoneFields";
export function CustomerFields({ readOnly = false }: { readOnly?: boolean }) {
  return (
    <section className="space-y-3">
      <h2 className="text-title-m">주문 고객</h2>
      <div className="space-y-2">
        <CheckoutFieldRow label="이름" required>
          <CheckoutField
            readOnly={readOnly}
            name="customerName"
            label="주문자 이름"
            placeholder="이름"
          />
        </CheckoutFieldRow>
        <CheckoutFieldRow label="이메일" required>
          <CheckoutField
            readOnly={readOnly}
            name="email"
            label="주문자 이메일"
            placeholder="midam@email.com"
            type="email"
          />
        </CheckoutFieldRow>
        <CheckoutFieldRow label="휴대전화" required>
          <PhoneFields owner="customer" readOnly={readOnly} />
        </CheckoutFieldRow>
      </div>
    </section>
  );
}
