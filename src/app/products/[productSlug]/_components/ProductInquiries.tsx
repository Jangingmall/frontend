"use client";

import { useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRightIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductInquiries } from "@/queries/inquiries/queries";
import { useAuthStore } from "@/stores/auth";
import type { ProductDetail, ProductNotify } from "@/types/product-detail";

import { InquiryFormDialog } from "./InquiryFormDialog";
import { InquiryItem } from "./InquiryItem";
import { InquiryListDialog } from "./InquiryListDialog";

interface ProductInquiriesProps {
  productId: number;
  isMock: boolean;
  product?: ProductDetail;
  onNotify: ProductNotify;
  onRequireLogin: () => void;
}
export function ProductInquiries({
  productId,
  isMock,
  product,
  onNotify,
  onRequireLogin,
}: ProductInquiriesProps) {
  const isAuthLoading = useAuthStore((state) => state.status === "loading");
  const viewerId = useAuthStore((state) =>
    state.status === "authenticated" ? (state.user?.id ?? null) : null,
  );
  const [excludeSecret, setExcludeSecret] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const query = useProductInquiries(productId, false, isMock, viewerId);
  const items =
    query.data?.items.filter((item) => !excludeSecret || !item.isSecret) ?? [];
  function compose() {
    if (isAuthLoading) return;
    if (viewerId === null) {
      onRequireLogin();
      return;
    }
    setListOpen(false);
    setFormOpen(true);
  }
  return (
    <section
      id="product-inquiries"
      className="scroll-mt-40 border-t border-border-neutral-weak px-2 pt-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-title-l leading-[1.3] font-bold">
          문의{query.data ? ` (${query.data.totalCount})` : ""}
        </h2>
        <div className="flex items-center gap-4">
          {isMock && (
            <Checkbox
              checked={excludeSecret}
              onCheckedChange={setExcludeSecret}
            >
              비밀글 제외
            </Checkbox>
          )}
          <Button
            size="s"
            className="h-9 w-18.75 min-w-18 px-0"
            onClick={compose}
            disabled={isAuthLoading}
            title={isAuthLoading ? "로그인 상태를 확인하고 있어요." : undefined}
          >
            문의하기
          </Button>
        </div>
      </div>
      {!isMock ? (
        <EmptyState title="문의 목록 조회는 일시 중단되었습니다. 공개 문의 등록은 가능합니다." />
      ) : query.isPending ? (
        <Skeleton
          role="status"
          aria-label="문의 불러오는 중"
          className="mt-4 h-40 w-full"
        />
      ) : query.isError ? (
        <ErrorState
          title="문의를 불러오지 못했어요"
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          {items.length ? (
            <Accordion className="mt-3 px-2 [&_[data-slot=accordion]]:space-y-3">
              {items.slice(0, 3).map((inquiry) => (
                <InquiryItem key={inquiry.id} inquiry={inquiry} />
              ))}
            </Accordion>
          ) : (
            <EmptyState
              title={
                query.data.totalCount === 0
                  ? "등록된 문의가 없습니다."
                  : "표시할 문의가 없습니다."
              }
            />
          )}
          {query.data.totalCount > 0 && (
            <div className="text-right">
              <Button
                variant="ghost"
                size="s"
                className="h-10 w-25 min-w-24 justify-end gap-0 px-0"
                aria-label="문의 전체보기"
                onClick={() => setListOpen(true)}
              >
                전체보기
                <ChevronRightIcon className="size-6" />
              </Button>
            </div>
          )}
        </>
      )}
      <InquiryListDialog
        open={listOpen}
        onOpenChange={setListOpen}
        items={items}
        excludeSecret={excludeSecret}
        onExcludeSecretChange={setExcludeSecret}
        onCompose={compose}
        isComposingDisabled={isAuthLoading}
      />
      <InquiryFormDialog
        key={viewerId ?? "anonymous"}
        open={formOpen && viewerId !== null}
        onOpenChange={setFormOpen}
        productId={productId}
        product={product}
        isMock={isMock}
        onNotify={onNotify}
        onRequireLogin={onRequireLogin}
      />
    </section>
  );
}
