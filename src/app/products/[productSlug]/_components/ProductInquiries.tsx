"use client";

import { useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
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
    if (!isMock) {
      onNotify("상품 문의 등록을 준비 중입니다.");
      return;
    }
    setListOpen(false);
    setFormOpen(true);
  }
  return (
    <section
      id="product-inquiries"
      className="scroll-mt-40 border-t border-border-jade-weak px-2 py-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-title-l">
          문의{query.data ? ` (${query.data.totalCount})` : ""}
        </h2>
        <Button
          variant="outline"
          size="xs"
          onClick={compose}
          disabled={isAuthLoading}
          title={isAuthLoading ? "로그인 상태를 확인하고 있어요." : undefined}
        >
          문의하기
        </Button>
      </div>
      {!isMock ? (
        <EmptyState title="상품 문의를 준비 중입니다." />
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
          <div className="my-3 flex items-center justify-end gap-2">
            <span className="text-body-s">비밀글 제외</span>
            <Toggle
              size="s"
              aria-label="비밀글 제외"
              checked={excludeSecret}
              onCheckedChange={setExcludeSecret}
            />
          </div>
          {items.length ? (
            <Accordion>
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
            <div className="mt-3 text-right">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setListOpen(true)}
              >
                문의 전체보기
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
