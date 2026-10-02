"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useKakaoPostcodePopup } from "react-daum-postcode";
import { FormProvider, useForm } from "react-hook-form";

import { submitPreviewOrder } from "@/api/purchase-preview/api";
import type { BenefitInput } from "@/api/purchase-preview/benefits";
import { CHECKOUT_PREVIEW_LINES } from "@/app/(protected)/checkout/_lib/checkout-fixtures";
import {
  checkoutFormSchema,
  type CheckoutFormValues,
  EMPTY_CHECKOUT_FORM,
} from "@/app/(protected)/checkout/_lib/checkout-form-schema";
import { getPaymentErrorMessage } from "@/app/(protected)/checkout/_lib/payment-error";
import { openPreviewPayment } from "@/app/(protected)/checkout/_lib/toss-preview";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PaymentsMethod } from "@/components/order/PaymentsMethod";
import { PurchaseStepIndicator } from "@/components/order/PurchaseStepIndicator";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";
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
  const openPostcode = useKakaoPostcodePopup();
  const paymentController = useRef<AbortController | null>(null);
  useEffect(() => () => paymentController.current?.abort(), []);
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
  const [benefits, setBenefits] = useState<BenefitInput>();
  const [discount, setDiscount] = useState(0);
  const amount = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  async function handlePayment() {
    if (!method) {
      setWarning("결제수단을 선택해 주세요.");
      return;
    }
    if (paymentController.current) return;
    setWarning("");
    let result: PreviewPaymentOutcome;
    try {
      const response = await submitPreviewOrder(
        lines,
        outcome ?? (method === "BANK_TRANSFER" ? "bank-pending" : "success"),
        benefits,
      );
      result = response.outcome;
      usePurchasePreviewStore.getState().setCheckoutTotal(response.total);
      if (!outcome && method !== "BANK_TRANSFER") {
        const orderId = `demo-${crypto.randomUUID()}`;
        sessionStorage.setItem(
          "preview-payment",
          JSON.stringify({ orderId, amount: response.total, lines }),
        );
        const controller = new AbortController();
        paymentController.current = controller;
        try {
          await openPreviewPayment(
            {
              amount: response.total,
              orderId,
              orderName: (lines[0]?.productName ?? "미담 시연 주문").slice(
                0,
                100,
              ),
              successUrl:
                window.location.origin +
                "/checkout/ui-preview-order?paymentResult=success",
              failUrl:
                window.location.origin +
                "/checkout/ui-preview-order?paymentResult=fail",
              method:
                method === "TOSS_PAY"
                  ? "TOSSPAY"
                  : method === "REALTIME_TRANSFER"
                    ? "TRANSFER"
                    : "CARD",
            },
            controller.signal,
          );
        } catch (error) {
          sessionStorage.removeItem("preview-payment");
          setWarning(getPaymentErrorMessage(error));
        } finally {
          paymentController.current = null;
        }
        return;
      }
    } catch {
      setWarning("시연 주문을 처리하지 못했습니다. 다시 시도해 주세요.");
      return;
    }
    if (result === "success" || result === "bank-pending") onComplete?.(result);
    else setFeedback(result);
  }
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
          void form.handleSubmit(handlePayment)(event);
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
                void openPostcode({
                  onComplete: (data) => {
                    form.setValue("postcode", data.zonecode, {
                      shouldValidate: true,
                    });
                    form.setValue("address", data.roadAddress || data.address, {
                      shouldValidate: true,
                    });
                    form.setFocus("addressDetail");
                  },
                }).catch(() =>
                  setWarning(
                    "주소 검색을 열지 못했습니다. 다시 시도해 주세요.",
                  ),
                );
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
            <DiscountSlots
              subtotal={amount}
              onApply={(input, value) => {
                setBenefits(input);
                setDiscount(value);
              }}
            />
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
              totalAmount={Math.max(0, amount - discount)}
              shippingLabel="무료"
              headingSize="m"
              totalLabel="총 주문금액"
            />
            <PaymentAgreement
              disabled={form.formState.isSubmitting}
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
