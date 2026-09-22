"use client";
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useKakaoPostcodePopup } from "react-daum-postcode";
import { FormProvider, useForm } from "react-hook-form";

import {
  type CheckoutFormValues,
  EMPTY_CHECKOUT_FORM,
} from "@/app/(protected)/checkout/_lib/checkout-form-schema";
import {
  clearOrderRequestKey,
  getOrderRequestKey,
  parseCartItemIds,
  savePaymentContext,
} from "@/app/(protected)/checkout/_lib/checkout-session";
import { getPaymentErrorMessage } from "@/app/(protected)/checkout/_lib/payment-error";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PaymentsMethod } from "@/components/order/PaymentsMethod";
import { PurchaseStepIndicator } from "@/components/order/PurchaseStepIndicator";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select, SelectItem } from "@/components/ui/select";
import { splitPhone } from "@/constants/phone";
import { useCartQuery } from "@/queries/cart";
import { useCreateAddressMutation } from "@/queries/member/mutations";
import {
  useAddressesQuery,
  useMemberProfileQuery,
} from "@/queries/member/queries";
import {
  useCreateOrderMutation,
  usePreparePaymentMutation,
} from "@/queries/payments";
import { useAuthStore } from "@/stores/auth";
import { getCartShippingAmount } from "@/types/cart";
import type { Address } from "@/types/member";
import type { CreateOrderInput } from "@/types/payment";
import type { PreviewPaymentMethod } from "@/types/purchase-preview";

import { CheckoutProducts } from "./CheckoutProducts";
import { CustomerFields } from "./CustomerFields";
import { DeliveryMemoField } from "./DeliveryMemoField";
import { DiscountSlots } from "./DiscountSlots";
import { PaymentAgreement } from "./PaymentAgreement";
import { ShippingFields } from "./ShippingFields";
export function RealCheckoutPage({
  allowOrder = true,
}: {
  allowOrder?: boolean;
}) {
  const params = useSearchParams();
  const ids = parseCartItemIds(params.get("items"));
  const user = useAuthStore((state) => state.user);
  const cart = useCartQuery(true, `member-${user?.id ?? "current"}`);
  const addresses = useAddressesQuery(user?.id);
  const createAddress = useCreateAddressMutation();
  const create = useCreateOrderMutation();
  const prepare = usePreparePaymentMutation();
  const [addressId, setAddressId] = useState<number>();
  const [method, setMethod] = useState<PreviewPaymentMethod>();
  const profile = useMemberProfileQuery();
  const form = useForm<CheckoutFormValues>({
    defaultValues: EMPTY_CHECKOUT_FORM,
  });
  const openPostcode = useKakaoPostcodePopup();
  const [sameCustomer, setSameCustomer] = useState(false);
  const [details, setDetails] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const createdAddress = useRef<Address | undefined>(undefined);
  const [revisedOrder, setRevisedOrder] = useState<{
    key: string;
    amount: number;
  } | null>(null);
  const lines = (cart.data?.lines ?? []).filter((line) =>
    ids.includes(Number(line.lineId)),
  );
  const loading = cart.isPending || addresses.isPending;
  const unavailable = cart.isError || addresses.isError;
  const invalidSelection =
    !allowOrder || !ids.length || lines.length !== ids.length;
  const blocked = loading || unavailable || invalidSelection;
  const selectedAddress =
    addressId ?? addresses.data?.find((address) => address.isDefault)?.id;
  const savedAddress = addresses.data?.find(
    (address) => address.id === selectedAddress,
  );
  const { setValue } = form;
  const hydratedAddress = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!profile.data) return;
    const phone = splitPhone(profile.data.phone);
    setValue("customerName", profile.data.name);
    setValue("email", profile.data.email);
    setValue("customerPhoneFirst", profile.data.phone.slice(0, 3));
    setValue("customerPhoneMiddle", phone.phoneMiddle);
    setValue("customerPhoneLast", phone.phoneLast);
  }, [profile.data, setValue]);
  useEffect(() => {
    if (!savedAddress || hydratedAddress.current === savedAddress.id) return;
    hydratedAddress.current = savedAddress.id;
    const phone = splitPhone(savedAddress.phone);
    setValue("recipientName", savedAddress.recipientName);
    setValue("recipientPhoneFirst", savedAddress.phone.slice(0, 3));
    setValue("recipientPhoneMiddle", phone.phoneMiddle);
    setValue("recipientPhoneLast", phone.phoneLast);
    setValue("postcode", savedAddress.zipCode);
    setValue("address", savedAddress.address1);
    setValue("addressDetail", savedAddress.address2);
  }, [savedAddress, setValue]);
  const productAmount = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const shippingAmount = getCartShippingAmount(
    cart.data?.sections ?? [],
    lines,
  );
  async function submit() {
    if (submitting.current || blocked) return;
    const values = form.getValues();
    const memo = values.memo === "직접 입력" ? values.memoText : values.memo;
    const addressInput = {
      recipientName: values.recipientName.trim(),
      phone: `${values.recipientPhoneFirst}${values.recipientPhoneMiddle}${values.recipientPhoneLast}`,
      zipCode: values.postcode,
      address1: values.address,
      address2: values.addressDetail.trim(),
      isDefault: false,
    };
    if (
      !addressInput.recipientName ||
      !/^\d{9,20}$/.test(addressInput.phone) ||
      !addressInput.zipCode ||
      !addressInput.address1 ||
      !method ||
      method === "BANK_TRANSFER" ||
      !agreed ||
      memo.length > 100
    ) {
      setError("배송지, 결제수단, 약관 동의를 확인해 주세요.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      // Reuse an identical saved address; persist edited shipping fields before ordering.
      const existing = [
        ...(addresses.data ?? []),
        ...(createdAddress.current ? [createdAddress.current] : []),
      ].find(
        (address) =>
          address.recipientName === addressInput.recipientName &&
          address.phone === addressInput.phone &&
          address.zipCode === addressInput.zipCode &&
          address.address1 === addressInput.address1 &&
          address.address2 === addressInput.address2,
      );
      const shippingAddress =
        existing ?? (await createAddress.mutateAsync(addressInput));
      createdAddress.current = shippingAddress;
      setAddressId(shippingAddress.id);
      const paymentMethod =
        method === "REALTIME_TRANSFER"
          ? "TRANSFER"
          : method === "TOSS_PAY"
            ? "EASY_PAY"
            : "CARD";
      const input: CreateOrderInput = {
        cartItemIds: ids,
        addressId: shippingAddress.id,
        deliveryRequest: memo.trim(),
        paymentMethod,
      };
      const key = getOrderRequestKey(
        input,
        JSON.stringify({
          memberId: user?.id,
          lines: lines.map(({ lineId, quantity, unitPrice, options }) => ({
            lineId,
            quantity,
            unitPrice,
            options,
          })),
          shippingAmount,
        }),
      );
      // 기존 주문이 예약한 재고는 품절로 보일 수 있어 재고/멱등성 판단을 서버에 맡긴다.
      const order = await create.mutateAsync({
        input,
        key,
      });
      if (["PAYMENT_FAILED", "CANCELED"].includes(order.status))
        clearOrderRequestKey(key);
      if (order.status !== "CREATED")
        throw new Error(
          "이미 처리된 주문입니다. 주문 내역에서 상태를 확인해 주세요.",
        );
      if (
        order.totalAmount !== productAmount + shippingAmount &&
        (revisedOrder?.key !== key || revisedOrder.amount !== order.totalAmount)
      ) {
        setRevisedOrder({ key, amount: order.totalAmount });
        throw new Error(
          `최종 주문 금액이 ${order.totalAmount.toLocaleString("ko-KR")}원으로 변경되었습니다. 변경된 금액을 확인한 뒤 결제 버튼을 다시 눌러 주세요.`,
        );
      }
      const payment = await prepare.mutateAsync({
        orderId: order.orderId,
        amount: order.totalAmount,
        paymentMethod,
      });
      if (
        payment.orderId !== order.orderId ||
        payment.amount !== order.totalAmount
      )
        throw new Error("결제 금액을 확인할 수 없습니다.");
      if (!payment.tossClientKey.trim())
        throw new Error(
          "결제 서비스 설정이 완료되지 않아 결제할 수 없습니다. 주문 내역에서 상태를 확인해 주세요.",
        );
      savePaymentContext({
        requestKey: key,
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        amount: payment.amount,
      });
      const toss = await loadTossPayments(payment.tossClientKey);
      const common = {
        amount: { currency: "KRW" as const, value: payment.amount },
        orderId: order.orderNumber,
        orderName:
          lines[0]!.productName +
          (lines.length > 1 ? ` 외 ${lines.length - 1}건` : ""),
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
      };
      const gateway = toss.payment({ customerKey: ANONYMOUS });
      if (paymentMethod === "TRANSFER") {
        await gateway.requestPayment({ ...common, method: "TRANSFER" });
      } else {
        await gateway.requestPayment({
          ...common,
          method: "CARD",
          card:
            paymentMethod === "EASY_PAY"
              ? { flowMode: "DIRECT", easyPay: "TOSSPAY" }
              : undefined,
        });
      }
    } catch (cause) {
      setError(getPaymentErrorMessage(cause));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <FormProvider {...form}>
      <form
        noValidate
        aria-label="주문 결제"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="mx-auto w-full max-w-[936px] px-6 pt-16 pb-[200px] text-font-dark"
      >
        <header className="mb-12 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
          <h1 className="text-title-xl">주문 결제</h1>
          <PurchaseStepIndicator current={2} />
        </header>
        {loading && (
          <p role="status" className="mb-6">
            주문 정보를 불러오는 중입니다.
          </p>
        )}
        {unavailable && (
          <div role="alert" className="mb-6">
            <p>주문 정보를 불러오지 못했습니다.</p>
            <Button
              type="button"
              onClick={() => {
                void cart.refetch();
                void addresses.refetch();
              }}
            >
              다시 시도
            </Button>
          </div>
        )}
        {!loading && !unavailable && invalidSelection && (
          <p role="status" className="mb-6">
            선택한 장바구니 상품을 확인할 수 없습니다.{" "}
            <Link href="/cart" className="underline">
              장바구니로 이동
            </Link>
          </p>
        )}
        <div className="grid grid-cols-[minmax(0,546px)_318px] items-start gap-6 max-md:grid-cols-1">
          <fieldset disabled={busy} className="min-w-0 space-y-6">
            <CustomerFields readOnly />
            <p className="text-caption text-font-dark-weak">
              주문자 정보는 회원 정보를 사용합니다. 변경은 마이페이지에서 할 수
              있습니다.
            </p>
            {profile.isError && (
              <p role="alert">
                회원 정보를 불러오지 못했습니다.{" "}
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => void profile.refetch()}
                >
                  다시 불러오기
                </Button>
              </p>
            )}
            <hr className="border-border-jade-weak" />
            {!!addresses.data?.length && (
              <Select
                ariaLabel="저장된 배송지"
                items={addresses.data.map((address) => ({
                  value: String(address.id),
                  label: `${address.recipientName} · ${address.address1}`,
                }))}
                value={selectedAddress?.toString() ?? null}
                placeholder="저장된 배송지 선택"
                onValueChange={(value) => {
                  setSameCustomer(false);
                  setAddressId(value ? Number(value) : undefined);
                }}
              >
                {addresses.data.map((address) => (
                  <SelectItem key={address.id} value={String(address.id)}>
                    {address.recipientName} · {address.address1}
                  </SelectItem>
                ))}
              </Select>
            )}
            <ShippingFields
              sameCustomer={sameCustomer}
              onSameCustomerChange={setSameCustomer}
              onAddressSearch={() => {
                void openPostcode({
                  onComplete: (data) => {
                    form.setValue("postcode", data.zonecode);
                    form.setValue("address", data.roadAddress || data.address);
                    form.setFocus("addressDetail");
                  },
                }).catch(() =>
                  setError("주소 검색을 열지 못했습니다. 다시 시도해 주세요."),
                );
              }}
            />
            <DeliveryMemoField />
            <hr className="border-border-jade-weak" />
            <CheckoutProducts
              showUnavailableDetails
              lines={lines}
              onArtisanClick={() =>
                setError("장인 상세 페이지는 준비 중입니다.")
              }
            />
            <hr className="border-border-jade-weak" />
            <DiscountSlots unavailable />
            <p className="text-caption text-font-dark-weak">
              할인코드·쿠폰·적립금은 서비스 준비 중입니다.
            </p>
            <hr className="border-border-jade-weak" />
            <PaymentsMethod
              value={method}
              onChange={setMethod}
              disabledMethods={["BANK_TRANSFER"]}
            />
            <p className="text-caption text-font-dark-weak">
              무통장입금은 입금 확인 기능 준비 중으로 사용할 수 없습니다.
            </p>
          </fieldset>
          <aside className="space-y-4 md:pt-9">
            <OrderSummary
              productAmount={productAmount}
              shippingAmount={shippingAmount}
              totalAmount={productAmount + shippingAmount}
              totalLabel="총 주문금액"
              headingSize="m"
            />
            <PaymentAgreement
              agreed={agreed}
              onAgreedChange={setAgreed}
              onDetails={() => setDetails(true)}
              disabled={busy || blocked}
              submitLabel={
                busy
                  ? "결제 준비 중…"
                  : revisedOrder
                    ? `${revisedOrder.amount.toLocaleString("ko-KR")}원 확인 후 결제`
                    : "결제하기"
              }
            />
            <p className="text-caption">
              최종 결제 금액은 서버에서 확인한 주문 금액입니다.
            </p>
            {error && <p role="alert">{error}</p>}
            <Link href="/mypage/orders" className="text-caption underline">
              주문 내역 확인
            </Link>
          </aside>
        </div>
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
