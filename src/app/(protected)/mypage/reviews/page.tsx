"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ReviewFormModal } from "@/components/review/ReviewFormModal";
import { resolveErrorMessage } from "@/constants/error-messages";
import { ApiError } from "@/lib/http/api-error";
import { useMemberProfileQuery } from "@/queries/member/queries";
import { useCreateReviewMutation } from "@/queries/reviews/mutations";
import {
  useMyReviewsQuery,
  useReviewableItemsQuery,
} from "@/queries/reviews/queries";
import type { ReviewableItem, ReviewFormInput } from "@/types/review";

import { MyReviewsList } from "./_components/MyReviewsList";
import { ReviewableItemsRow } from "./_components/ReviewableItemsRow";

const PAGE_SIZE = 5;

/**
 * 마이페이지 "내가 쓴 후기" 화면(Figma MY-3, `/mypage/reviews`) — 빠른 후기 작성(리뷰
 * 미작성 + 배송완료 주문 아이템) + 내가 작성한 후기 목록. 인증 데이터라 서버 프리페치는
 * 하지 않는다(`AddressesTab`과 동일 패턴).
 */
export default function MypageReviewsPage() {
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

  const profileQuery = useMemberProfileQuery();
  const reviewableQuery = useReviewableItemsQuery();
  const myReviewsQuery = useMyReviewsQuery(page);

  const [writeTarget, setWriteTarget] = useState<ReviewableItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const createMutation = useCreateReviewMutation();

  function resolveActionErrorMessage(error: unknown) {
    return error instanceof ApiError
      ? resolveErrorMessage(error.code, error.status)
      : resolveErrorMessage();
  }

  async function handleCreate(target: ReviewableItem, input: ReviewFormInput) {
    setFormError(null);
    try {
      await createMutation.mutateAsync({
        productId: target.productId,
        orderItemId: target.orderItemId,
        input,
      });
      setWriteTarget(null);
    } catch (error) {
      setFormError(resolveActionErrorMessage(error));
    }
  }

  function updatePage(next: number) {
    const params = new URLSearchParams(window.location.search);
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    window.history.pushState(
      null,
      "",
      `/mypage/reviews${params.size ? `?${params}` : ""}`,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ReviewableItemsRow
        nickname={profileQuery.data?.name}
        data={reviewableQuery.data}
        isPending={reviewableQuery.isPending}
        hasError={reviewableQuery.isError}
        onRetry={() => void reviewableQuery.refetch()}
        onWriteReview={(item) => {
          setFormError(null);
          setWriteTarget(item);
        }}
      />
      <MyReviewsList
        data={myReviewsQuery.data}
        isPending={myReviewsQuery.isPending}
        isFetching={myReviewsQuery.isFetching}
        hasError={myReviewsQuery.isError}
        onRetry={() => void myReviewsQuery.refetch()}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={updatePage}
      />

      {writeTarget && (
        <ReviewFormModal
          open
          item={{
            productName: writeTarget.productName,
            thumbnailUrl: writeTarget.thumbnailUrl,
            options: writeTarget.options,
          }}
          purchasedAt={writeTarget.purchasedAt}
          submitting={createMutation.isPending}
          submitError={formError}
          onOpenChange={(open) => {
            if (!open) {
              setWriteTarget(null);
              setFormError(null);
            }
          }}
          onSubmit={(input) => void handleCreate(writeTarget, input)}
        />
      )}
    </div>
  );
}
