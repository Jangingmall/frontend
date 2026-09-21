"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ProductCardGrid } from "@/components/product/ProductCardGrid";
import { Toast } from "@/components/ui/toast";
import { useRemoveWishMutation } from "@/queries/wishlist/mutations";
import { useWishlistQuery } from "@/queries/wishlist/queries";

const REMOVED_TOAST_DURATION_MS = 3000;

/**
 * 마이페이지 찜 목록 화면(Figma MY-4, `/mypage/wishlist`) — 4열 카드 그리드, 전부 이미
 * 찜된 상태라 하트는 항상 해제만 한다. 인증 데이터라 서버 프리페치는 하지 않는다
 * (`AddressesTab`·`MypageReviewsPage`와 동일 패턴). 페이지 전환은 `products` 목록과
 * 동일하게 shallow `history.pushState`로 URL만 갱신한다.
 */
export default function MypageWishlistPage() {
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const [showRemovedToast, setShowRemovedToast] = useState(false);

  const query = useWishlistQuery(page);
  const removeWish = useRemoveWishMutation(page);

  function updatePage(next: number) {
    const params = new URLSearchParams(window.location.search);
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    window.history.pushState(
      null,
      "",
      `/mypage/wishlist${params.size ? `?${params}` : ""}`,
    );
  }

  function handleToggle(productId: number) {
    removeWish.mutate(productId, {
      onSuccess: () => {
        setShowRemovedToast(true);
        window.setTimeout(
          () => setShowRemovedToast(false),
          REMOVED_TOAST_DURATION_MS,
        );
      },
    });
  }

  return (
    <>
      <ProductCardGrid
        data={query.data}
        isPending={query.isPending}
        isFetching={query.isFetching}
        hasError={query.isError}
        onRetry={() => void query.refetch()}
        onPageChange={updatePage}
        emptyTitle="찜한 상품이 없어요"
        emptyAction={
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-xs border border-(--button-border-black) px-6 text-body-m text-font-dark transition-colors hover:bg-states-hover"
          >
            상품 보러 가기
          </Link>
        }
        wishInteraction={{
          wishedIds: new Set(query.data?.items.map((item) => item.id) ?? []),
          onToggle: handleToggle,
        }}
      />
      {showRemovedToast && (
        <div className="fixed inset-x-4 bottom-6 z-40 flex justify-center">
          <Toast>찜 목록에서 삭제되었습니다.</Toast>
        </div>
      )}
    </>
  );
}
