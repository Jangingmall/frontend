import { Field } from "@base-ui/react/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { InputField } from "@/components/ui/input-field";
import { Select, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCreateInquiry } from "@/queries/inquiries/mutations";
import { useAuthStore } from "@/stores/auth";
import type { ProductDetail, ProductNotify } from "@/types/product-detail";

import {
  inquiryFormSchema,
  type InquiryFormValues,
} from "./inquiry-form-schema";
import { ProductDetailImage } from "./ProductDetailImage";

interface InquiryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  product?: ProductDetail;
  isMock: boolean;
  onNotify: ProductNotify;
  onRequireLogin: () => void;
}
const TYPES = ["상품 상세문의", "배송", "기타"];
export function InquiryFormDialog({
  open,
  onOpenChange,
  productId,
  product,
  isMock,
  onNotify,
  onRequireLogin,
}: InquiryFormDialogProps) {
  const formId = useId();
  const titleId = useId();
  const bodyId = useId();
  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: { title: "", body: "", isSecret: false },
  });
  const type = useWatch({ control: form.control, name: "type" });
  const body = useWatch({ control: form.control, name: "body" });
  const mutation = useCreateInquiry(productId, isMock);
  const submitting = useRef(false);
  async function submit(values: InquiryFormValues) {
    if (submitting.current) return;
    if (useAuthStore.getState().status !== "authenticated") {
      onRequireLogin();
      return;
    }
    submitting.current = true;
    form.clearErrors("root");
    try {
      await mutation.mutateAsync(values);
      form.reset();
      onOpenChange(false);
      onNotify("문의가 등록되었습니다.");
    } catch {
      form.setError("root", {
        message:
          "문의를 등록하지 못했어요. 입력한 내용을 확인한 후 다시 시도해주세요.",
      });
    } finally {
      submitting.current = false;
    }
  }
  function close(next: boolean) {
    if (submitting.current) return;
    if (!next) form.reset();
    onOpenChange(next);
  }
  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="상품 문의하기"
      variant="form"
      footer={
        <div className="flex gap-2.5">
          <Button
            variant="jade"
            size="xl"
            type="button"
            className="min-w-0 flex-1 border-border-neutral-subtle px-3 sm:w-40 sm:flex-none sm:px-6"
            disabled={mutation.isPending}
            onClick={() => close(false)}
          >
            취소
          </Button>
          <Button
            type="submit"
            form={formId}
            size="xl"
            className="min-w-0 flex-1 px-3 sm:px-6"
            loading={mutation.isPending}
          >
            등록하기
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
        noValidate
        className="space-y-4"
      >
        {product && (
          <div className="border-b border-border-jade-weak pb-4">
            <p className="mb-3 text-title-s">상품명</p>
            <div className="flex gap-4">
              {product.images[0] && (
                <span className="relative size-22.5 shrink-0">
                  <ProductDetailImage image={product.images[0]} sizes="90px" />
                </span>
              )}
              <div className="min-w-0 space-y-2 break-words">
                <div>
                  <p className="text-body-m font-semibold">{product.name}</p>
                  <p className="text-body-m text-font-dark-weak">
                    {product.artisan?.name}
                  </p>
                </div>
                <p className="text-body-s-b">
                  {product.price.toLocaleString("ko-KR")}원
                </p>
              </div>
            </div>
          </div>
        )}
        {form.formState.errors.root && (
          <p role="alert" className="text-body-s text-red-font">
            {form.formState.errors.root.message}
          </p>
        )}
        <Field.Root
          invalid={Boolean(form.formState.errors.type)}
          className="space-y-2"
        >
          <p className="text-body-s-b">
            문의 유형 <span className="text-red-font">*</span>
          </p>
          <Controller
            name="type"
            control={form.control}
            render={({ field }) => (
              <Select
                ariaLabel="문의 유형"
                inputRef={field.ref}
                name={field.name}
                required
                className="aria-invalid:border-red-border aria-invalid:focus-visible:outline-red-border"
                items={TYPES.map((value) => ({ value, label: value }))}
                value={field.value ?? null}
                onValueChange={field.onChange}
                onOpenChange={(isOpen) => {
                  if (!isOpen) field.onBlur();
                }}
                placeholder="선택해주세요."
                disabled={mutation.isPending}
              >
                {TYPES.map((value) => (
                  <SelectItem value={value} key={value}>
                    {value}
                  </SelectItem>
                ))}
              </Select>
            )}
          />
          {form.formState.errors.type && (
            <Field.Error
              match
              role="alert"
              className="text-caption text-red-font"
            >
              {form.formState.errors.type.message}
            </Field.Error>
          )}
        </Field.Root>
        {type === "기타" && (
          <div className="space-y-2">
            <label htmlFor={titleId} className="block text-body-s-b">
              문의 제목 <span className="text-red-font">*</span>
            </label>
            <InputField
              id={titleId}
              className="h-9"
              placeholder="30자 이내로 입력해주세요."
              maxLength={30}
              error={form.formState.errors.title?.message}
              disabled={mutation.isPending}
              {...form.register("title")}
            />
          </div>
        )}
        <div className="space-y-3">
          <label htmlFor={bodyId} className="block text-body-s-b">
            내용 <span className="text-red-font">*</span>
          </label>
          <div
            className={cn(
              "flex min-h-27 flex-col border p-2",
              form.formState.errors.body
                ? "border-red-border"
                : "border-border-neutral-subtle focus-within:border-border-jade-fill",
            )}
          >
            <textarea
              id={bodyId}
              placeholder="문의할 내용을 작성해주세요."
              maxLength={2000}
              aria-invalid={Boolean(form.formState.errors.body)}
              aria-describedby={
                form.formState.errors.body ? `${bodyId}-error` : undefined
              }
              disabled={mutation.isPending}
              rows={4}
              className="[field-sizing:content] min-h-19 w-full resize-none text-body-s outline-none"
              {...form.register("body")}
            />
            <p className="text-right text-caption text-font-dark-weak">
              {body?.length ?? 0} / 2000 자
            </p>
          </div>
          {form.formState.errors.body && (
            <p
              id={`${bodyId}-error`}
              role="alert"
              className="text-caption text-red-font"
            >
              {form.formState.errors.body.message}
            </p>
          )}
        </div>
        <Controller
          name="isSecret"
          control={form.control}
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={mutation.isPending}
            >
              비밀글 설정
            </Checkbox>
          )}
        />
        <Accordion className="bg-fill-neutral-weak">
          <AccordionItem title="작성 시 유의사항" value="notice">
            <p className="text-body-s">
              상품과 관련된 내용을 남겨주세요. 주문번호, 연락처 등 개인정보가
              포함된 문의는 비밀글로 설정해주세요. 욕설이나 광고 등 관련 없는
              내용은 삭제될 수 있습니다.
            </p>
          </AccordionItem>
        </Accordion>
      </form>
    </Dialog>
  );
}
