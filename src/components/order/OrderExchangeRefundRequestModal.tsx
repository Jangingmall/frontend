"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  ORDER_EXCHANGE_REASON_OPTIONS,
  ORDER_REFUND_REASON_OPTIONS,
} from "@/constants/order";
import type {
  OrderClaimItemSummary,
  OrderExchangeRefundRequest,
} from "@/types/order";

import { OrderClaimPhotoField } from "./OrderClaimPhotoField";
import { OrderClaimProductSummary } from "./OrderClaimProductSummary";
import {
  OrderClaimReasonField,
  type OrderClaimReasonValue,
} from "./OrderClaimReasonField";

const exchangeRefundFormSchema = z
  .object({
    type: z.enum(["EXCHANGE", "RETURN"]).nullable(),
    reason: z.object({
      label: z.string(),
      freeText: z.string().optional(),
    }),
    photos: z.array(z.instanceof(File)),
  })
  .superRefine((value, ctx) => {
    if (!value.type) {
      ctx.addIssue({
        code: "custom",
        path: ["type"],
        message: "교환 또는 환불을 선택해주세요.",
      });
    }
    if (!value.reason.label) {
      ctx.addIssue({
        code: "custom",
        path: ["reason", "label"],
        message: "신청 사유를 선택해주세요.",
      });
    } else if (
      value.reason.label === "직접 입력" &&
      !(value.reason.freeText ?? "").trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reason", "freeText"],
        message: "신청 사유를 작성해주세요.",
      });
    }
    if (value.photos.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["photos"],
        message: "사진을 1장 이상 첨부해주세요.",
      });
    }
  });

type ExchangeRefundFormValues = z.infer<typeof exchangeRefundFormSchema>;

const DEFAULT_VALUES: ExchangeRefundFormValues = {
  type: null,
  reason: { label: "", freeText: undefined },
  photos: [],
};

interface OrderExchangeRefundRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: OrderClaimItemSummary;
  /** `OrderExchangeRefundRequest.orderItemId`로 그대로 실려 나간다 — `OrderClaimItemSummary`는
   * 순수 표시용 필드만 담고 식별자는 안 담아서 별도 prop으로 받는다. */
  orderItemId: number;
  /** ISO datetime. */
  purchasedAt: string;
  orderNumber: string;
  submitting?: boolean;
  submitError?: string | null;
  onSubmit: (input: OrderExchangeRefundRequest) => void;
}

/** 교환·환불 신청(MY-exchange) — 교환/환불 선택 + 사유(직접 입력 가능) + 사진 첨부(필수). */
export function OrderExchangeRefundRequestModal({
  open,
  onOpenChange,
  item,
  orderItemId,
  purchasedAt,
  orderNumber,
  submitting = false,
  submitError = null,
  onSubmit,
}: OrderExchangeRefundRequestModalProps) {
  const formId = useId();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ExchangeRefundFormValues>({
    resolver: zodResolver(exchangeRefundFormSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const type = useWatch({ control, name: "type" });
  const reasonOptions =
    type === "EXCHANGE"
      ? ORDER_EXCHANGE_REASON_OPTIONS
      : ORDER_REFUND_REASON_OPTIONS;

  function close(next: boolean) {
    if (submitting) return;
    if (!next) reset(DEFAULT_VALUES);
    onOpenChange(next);
  }

  function submit(values: ExchangeRefundFormValues) {
    if (!values.type) return;
    onSubmit({
      orderItemId,
      type: values.type,
      reasonLabel: values.reason.label,
      description: values.reason.freeText?.trim() || undefined,
      photos: values.photos,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="교환 · 환불 신청"
      variant="form"
      scrollableContent={false}
      headerAction={
        <span className="text-body-s text-font-dark-subtle">
          주문번호 : {orderNumber}
        </span>
      }
      footer={
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="xl"
            className="max-w-40 min-w-0 flex-1"
            disabled={submitting}
            onClick={() => close(false)}
          >
            취소
          </Button>
          <Button
            type="submit"
            form={formId}
            size="xl"
            className="min-w-0 flex-1"
            loading={submitting}
          >
            등록하기
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => void handleSubmit(submit)(event)}
        noValidate
        className="space-y-4"
      >
        {submitError != null && (
          <p role="alert" className="text-body-s text-red-font">
            {submitError}
          </p>
        )}

        <OrderClaimProductSummary item={item} purchasedAt={purchasedAt} />

        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1 text-body-s-b text-font-dark">
            교환 · 환불 선택
            <span className="font-normal text-red-font">*</span>
          </span>
          <div
            role="group"
            aria-label="교환 · 환불 선택"
            className="flex gap-2"
          >
            <Button
              type="button"
              variant={type === "EXCHANGE" ? "solid" : "outline"}
              size="m"
              className="flex-1"
              aria-pressed={type === "EXCHANGE"}
              onClick={() => {
                setValue("type", "EXCHANGE");
                setValue("reason", { label: "", freeText: undefined });
              }}
            >
              교환
            </Button>
            <Button
              type="button"
              variant={type === "RETURN" ? "solid" : "outline"}
              size="m"
              className="flex-1"
              aria-pressed={type === "RETURN"}
              onClick={() => {
                setValue("type", "RETURN");
                setValue("reason", { label: "", freeText: undefined });
              }}
            >
              환불
            </Button>
          </div>
          {errors.type?.message != null && (
            <p role="alert" className="px-2 py-1 text-caption text-red-font">
              {errors.type.message}
            </p>
          )}
        </div>

        <Controller
          control={control}
          name="reason"
          render={({ field }) => (
            <OrderClaimReasonField
              options={reasonOptions}
              value={field.value as OrderClaimReasonValue}
              onChange={field.onChange}
              ariaLabel="신청 사유"
              freeTextPlaceholder={`${type === "EXCHANGE" ? "교환" : "환불"} 사유를 작성해주세요.`}
              error={
                errors.reason?.label?.message ??
                errors.reason?.freeText?.message
              }
            />
          )}
        />

        <Controller
          control={control}
          name="photos"
          render={({ field }) => (
            <OrderClaimPhotoField
              value={field.value}
              onChange={field.onChange}
              required
              error={errors.photos?.message}
            />
          )}
        />

        <Accordion>
          <AccordionItem title="교환 · 환불 신청 시 유의사항">
            <ul className="list-disc space-y-1 pl-4">
              <li>단순 변심에 의한 교환·환불 시 왕복 배송비가 청구됩니다.</li>
              <li>
                주문제작 상품은 단순 변심에 의한 교환·환불이 제한될 수 있습니다.
              </li>
              <li>신청이 접수되면 판매자 확인 후 처리 결과가 안내됩니다.</li>
            </ul>
          </AccordionItem>
        </Accordion>
      </form>
    </Dialog>
  );
}
