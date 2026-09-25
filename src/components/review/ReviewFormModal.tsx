"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { OrderClaimPhotoField } from "@/components/order/OrderClaimPhotoField";
import { OrderClaimProductSummary } from "@/components/order/OrderClaimProductSummary";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { OrderClaimItemSummary } from "@/types/order";
import type { ReviewFormInput } from "@/types/review";

import { ReviewRatingInput } from "./ReviewRatingInput";

const CONTENT_MAX_LENGTH = 2000;

const reviewFormSchema = z.object({
  rating: z
    .number()
    .min(0.5, { message: "별점을 입력해주세요." })
    .refine((rating) => rating >= 1, {
      message: "별점은 1점 이상 입력해주세요.",
    })
    .max(5)
    .multipleOf(0.5),
  content: z
    .string()
    .trim()
    .min(1, { message: "후기 내용을 입력해주세요." })
    .max(CONTENT_MAX_LENGTH),
  photos: z.array(z.instanceof(File)),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

const DEFAULT_VALUES: ReviewFormValues = { rating: 0, content: "", photos: [] };

interface ReviewFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `OrderClaimProductSummary`와 같은 셰이프를 그대로 재사용한다. */
  item: OrderClaimItemSummary;
  /** ISO datetime — `OrderClaimProductSummary`의 "N 구매" 표시용. BE가 아직 안 내려주면
   * `null`(`be-requests.md` #11) — 그 줄만 생략된다. */
  purchasedAt: string | null;
  submitting?: boolean;
  submitError?: string | null;
  onSubmit: (input: ReviewFormInput) => void;
}

/** 후기 작성 모달(MY-review) — 작성 전용(수정 없음, 대응 BE API가 없다). */
export function ReviewFormModal({
  open,
  onOpenChange,
  item,
  purchasedAt,
  submitting = false,
  submitError = null,
  onSubmit,
}: ReviewFormModalProps) {
  const formId = useId();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  function close(next: boolean) {
    if (submitting) return;
    if (!next) reset(DEFAULT_VALUES);
    onOpenChange(next);
  }

  function submit(values: ReviewFormValues) {
    onSubmit(values);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="후기 작성하기"
      variant="form"
      scrollableContent={false}
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

        <div className="border-t border-border-neutral-weak" />

        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-body-s-b text-font-dark">
                이 상품은 어떠셨나요? <span className="text-red-font">*</span>
              </p>
              <p className="text-caption text-font-dark-secondary">
                별점을 입력해주세요
              </p>
              <ReviewRatingInput
                value={field.value}
                onChange={field.onChange}
                error={errors.rating?.message}
              />
            </div>
          )}
        />

        <div className="border-t border-border-neutral-weak" />

        <Controller
          control={control}
          name="photos"
          render={({ field }) => (
            <OrderClaimPhotoField
              value={field.value}
              onChange={field.onChange}
              showLabel={false}
            />
          )}
        />

        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <Textarea
              aria-label="후기 본문"
              placeholder="어떤 점이 좋으셨는지 작성해주세요!"
              maxLength={CONTENT_MAX_LENGTH}
              value={field.value}
              onChange={field.onChange}
              error={errors.content?.message}
            />
          )}
        />

        <Accordion>
          <AccordionItem title="후기 작성 시 유의사항">
            <ul className="list-disc space-y-1 pl-4">
              <li>등록한 후기는 다른 구매자에게 공개됩니다.</li>
              <li>
                주문·상품과 무관한 내용은 사전 통보 없이 삭제될 수 있습니다.
              </li>
              <li>등록 후 수정·삭제는 지원하지 않습니다.</li>
            </ul>
          </AccordionItem>
        </Accordion>
      </form>
    </Dialog>
  );
}
