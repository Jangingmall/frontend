"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ORDER_CANCEL_REASON_OPTIONS } from "@/constants/order";
import type { OrderCancelRequest, OrderClaimItemSummary } from "@/types/order";

import { OrderClaimPhotoField } from "./OrderClaimPhotoField";
import { OrderClaimProductSummary } from "./OrderClaimProductSummary";
import {
  OrderClaimReasonField,
  type OrderClaimReasonValue,
} from "./OrderClaimReasonField";

const cancelFormSchema = z
  .object({
    reason: z.object({
      label: z.string(),
      freeText: z.string().optional(),
    }),
    photos: z.array(z.instanceof(File)),
  })
  .superRefine((value, ctx) => {
    if (!value.reason.label) {
      ctx.addIssue({
        code: "custom",
        path: ["reason", "label"],
        message: "취소 사유를 선택해주세요.",
      });
    } else if (
      value.reason.label === "직접 입력" &&
      !(value.reason.freeText ?? "").trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reason", "freeText"],
        message: "취소 사유를 작성해주세요.",
      });
    }
  });

type CancelFormValues = z.infer<typeof cancelFormSchema>;

const DEFAULT_VALUES: CancelFormValues = {
  reason: { label: "", freeText: undefined },
  photos: [],
};

interface OrderCancelRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: OrderClaimItemSummary;
  /** ISO datetime. */
  purchasedAt: string;
  orderNumber: string;
  submitting?: boolean;
  submitError?: string | null;
  onSubmit: (input: OrderCancelRequest) => void;
}

/** 주문 취소 요청(MY-request) — 취소 사유(직접 입력 가능) + 사진 첨부(선택). */
export function OrderCancelRequestModal({
  open,
  onOpenChange,
  item,
  purchasedAt,
  orderNumber,
  submitting = false,
  submitError = null,
  onSubmit,
}: OrderCancelRequestModalProps) {
  const formId = useId();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CancelFormValues>({
    resolver: zodResolver(cancelFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  function close(next: boolean) {
    if (submitting) return;
    if (!next) reset(DEFAULT_VALUES);
    onOpenChange(next);
  }

  function submit(values: CancelFormValues) {
    onSubmit({
      reason: values.reason.freeText?.trim() || values.reason.label,
      photos: values.photos,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="주문 취소 요청"
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

        <Controller
          control={control}
          name="reason"
          render={({ field }) => (
            <OrderClaimReasonField
              options={ORDER_CANCEL_REASON_OPTIONS}
              value={field.value as OrderClaimReasonValue}
              onChange={field.onChange}
              ariaLabel="취소 사유"
              freeTextPlaceholder="취소 사유를 작성해주세요."
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
            />
          )}
        />

        <Accordion>
          <AccordionItem title="주문 취소 요청 시 유의사항">
            <ul className="list-disc space-y-1 pl-4">
              <li>취소 요청이 접수되면 되돌릴 수 없습니다.</li>
              <li>결제수단에 따라 환불까지 일정 기간이 소요될 수 있습니다.</li>
              <li>
                주문제작 상품은 제작 진행 상황에 따라 취소가 제한될 수 있습니다.
              </li>
            </ul>
          </AccordionItem>
        </Accordion>
      </form>
    </Dialog>
  );
}
