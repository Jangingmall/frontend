"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ProductCardGrid } from "@/components/product/ProductCardGrid";
import { Toast } from "@/components/ui/toast";
import { useRecentViewsQuery } from "@/queries/recent-views/queries";
import { useToggleWishMutation } from "@/queries/wishlist/mutations";
import { useWishedIdsQuery } from "@/queries/wishlist/queries";

const WISH_TOAST_DURATION_MS = 3000;

/**
 * 마이페이지 최근 본 상품 화면(Figma MY-5, `/mypage/recent`) — 찜 목록과 같은 4열 카드
 * 그리드를 재사용하되, 최신순으로 고정 정렬(서버가 이미 `viewedAt DESC`로 정렬)되고
 * 카드마다 실제 찜 여부를 반영한 하트로 찜을 추가/해제할 수 있다(Figma MY-5 확인).
 * "전체 삭제" 버튼은 Figma에 안 보여 v1엔 넣지 않는다.
 */
export default function MypageRecentPage() {
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const query = useRecentViewsQuery(page);
  const wishedIdsQuery = useWishedIdsQuery(true);
  const toggleWish = useToggleWishMutation();

  function updatePage(next: number) {
    const params = new URLSearchParams(window.location.search);
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    window.history.pushState(
      null,
      "",
      `/mypage/recent${params.size ? `?${params}` : ""}`,
    );
  }

  function handleToggle(productId: number) {
    const wasWished = wishedIdsQuery.data?.has(productId) ?? false;
    toggleWish.mutate(
      { productId, wished: wasWished },
      {
        onSuccess: () => {
          setToastMessage(
            wasWished
              ? "찜 목록에서 삭제되었습니다."
              : "찜 목록에 추가했습니다.",
          );
          window.setTimeout(
            () => setToastMessage(null),
            WISH_TOAST_DURATION_MS,
          );
        },
      },
    );
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
        emptyTitle="최근 본 상품이 없어요"
        emptyAction={
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-xs border border-(--button-border-black) px-6 text-body-m text-font-dark transition-colors hover:bg-states-hover"
          >
            상품 보러 가기
          </Link>
        }
        wishInteraction={{
          wishedIds: wishedIdsQuery.data ?? new Set(),
          onToggle: handleToggle,
        }}
      />
      {toastMessage && (
        <div className="fixed inset-x-4 bottom-6 z-40 flex justify-center">
          <Toast>{toastMessage}</Toast>
        </div>
      )}
    </>
  );
}
