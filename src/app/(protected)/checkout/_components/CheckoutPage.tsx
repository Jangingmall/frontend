"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { CHECKOUT_PREVIEW_LINES } from "@/app/(protected)/checkout/_lib/checkout-fixtures";
import {
  checkoutFormSchema,
  type CheckoutFormValues,
  EMPTY_CHECKOUT_FORM,
} from "@/app/(protected)/checkout/_lib/checkout-form-schema";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PaymentsMethod } from "@/components/order/PaymentsMethod";
import { PurchaseStepIndicator } from "@/components/order/PurchaseStepIndicator";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import type {
  CartPreviewLine,
  PreviewPaymentMethod,
  PreviewPaymentOutcome,
} from "@/types/purchase-preview";

import { CheckoutProducts } from "./CheckoutProducts";
import { CustomerFields } from "./CustomerFields";
import { DeliveryMemoField } from "./DeliveryMemoField";
import { DiscountSlots } from "./DiscountSlots";
import { PaymentAgreement } from "./PaymentAgreement";
import {
  type PaymentFailure,
  PaymentFeedbackDialog,
} from "./PaymentFeedbackDialog";
import { ShippingFields } from "./ShippingFields";
interface CheckoutPageProps {
  lines?: CartPreviewLine[];
  initialValues?: Partial<CheckoutFormValues>;
  initialMethod?: PreviewPaymentMethod;
  initialFeedback?: PaymentFailure;
  initialWarning?: string;
  outcome?: PreviewPaymentOutcome;
  onComplete?: (outcome: "success" | "bank-pending") => void;
  onCart?: () => void;
}
export function CheckoutPage({
  lines = CHECKOUT_PREVIEW_LINES,
  initialValues,
  initialMethod,
  initialFeedback,
  initialWarning,
  outcome,
  onComplete,
  onCart,
}: CheckoutPageProps) {
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { ...EMPTY_CHECKOUT_FORM, ...initialValues },
    reValidateMode: "onChange",
  });
  const [sameCustomer, setSameCustomer] = useState(false),
    [agreed, setAgreed] = useState(false),
    [method, setMethod] = useState(initialMethod),
    [feedback, setFeedback] = useState<PaymentFailure | null>(
      initialFeedback ?? null,
    ),
    [warning, setWarning] = useState(initialWarning ?? ""),
    [details, setDetails] = useState(false);
  const amount = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const submit = form.handleSubmit(() => {
    if (!method) {
      setWarning("결제수단을 선택해 주세요.");
      return;
    }
    setWarning("");
    const result =
      outcome ?? (method === "BANK_TRANSFER" ? "bank-pending" : "success");
    if (result === "success" || result === "bank-pending") onComplete?.(result);
    else setFeedback(result);
  });
  return (
    <FormProvider {...form}>
      <form
        noValidate
        aria-label="주문 결제"
        onSubmit={(event) => {
          if (!agreed) {
            event.preventDefault();
            setWarning("약관에 동의해 주세요.");
            return;
          }
          void submit(event);
        }}
        className="mx-auto w-full max-w-[936px] px-6 pt-16 pb-[200px] text-font-dark"
      >
        <header className="mb-12 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
          <h1 className="text-title-xl">주문 결제</h1>
          <PurchaseStepIndicator current={2} />
        </header>
        <div className="grid grid-cols-[minmax(0,546px)_318px] items-start gap-6 max-md:grid-cols-1">
          <div className="min-w-0 space-y-6">
            <CustomerFields />
            <hr className="border-border-jade-weak" />
            <ShippingFields
              sameCustomer={sameCustomer}
              onSameCustomerChange={setSameCustomer}
              onAddressSearch={() => {
                form.setValue("postcode", "00000", { shouldValidate: true });
                form.setValue("address", "서울특별시 강남구 선릉로 123", {
                  shouldValidate: true,
                });
                form.setFocus("addressDetail");
              }}
            />
            <DeliveryMemoField />
            <hr className="border-border-jade-weak" />
            <CheckoutProducts
              lines={lines}
              onArtisanClick={() =>
                setWarning("장인 상세 페이지는 준비 중입니다.")
              }
            />
            <hr className="border-border-jade-weak" />
            <DiscountSlots />
            <hr className="border-border-jade-weak" />
            <PaymentsMethod
              value={method}
              onChange={(value) => {
                setMethod(value);
                setWarning("");
              }}
            />
          </div>
          <div className="space-y-4 md:pt-9">
            <OrderSummary
              productAmount={amount}
              shippingAmount={0}
              totalAmount={amount}
              shippingLabel="무료"
              headingSize="m"
              totalLabel="총 주문금액"
            />
            <PaymentAgreement
              agreed={agreed}
              onAgreedChange={(value) => {
                setAgreed(value);
                setWarning("");
              }}
              onDetails={() => setDetails(true)}
            />
          </div>
        </div>
        {warning && (
          <div className="fixed bottom-8 left-1/2 z-50 max-w-[calc(100%-32px)] -translate-x-1/2">
            <Toast actionLabel="닫기" onAction={() => setWarning("")}>
              {warning}
            </Toast>
          </div>
        )}
        <PaymentFeedbackDialog
          outcome={feedback}
          onClose={() => setFeedback(null)}
          onCart={() => onCart?.()}
        />
        <Dialog
          open={details}
          onOpenChange={setDetails}
          title="이용약관"
          description="결제 전 이용 정보 제공 약관 등의 내용을 확인해 주세요."
        >
          <p className="text-body-m">약관 상세 내용은 준비 중입니다.</p>
          <Button
            type="button"
            className="mt-6 w-full"
            onClick={() => setDetails(false)}
          >
            확인
          </Button>
        </Dialog>
      </form>
    </FormProvider>
  );
}
