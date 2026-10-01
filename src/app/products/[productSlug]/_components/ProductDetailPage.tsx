"use client";

import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { recordRecentView } from "@/api/recent-views/api";
import { FloatingActions } from "@/components/common/floating-actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import { publicEnv } from "@/lib/env";
import { useAuthStore } from "@/stores/auth";
import type { ProductDetail, ProductNotify } from "@/types/product-detail";

import { ProductDetailGallery } from "./ProductDetailGallery";
import { ProductInformation } from "./ProductInformation";
import { ProductInquiries } from "./ProductInquiries";
import { ProductPurchasePanel } from "./ProductPurchasePanel";
import { ProductReviews } from "./ProductReviews";
import { RelatedProducts } from "./RelatedProducts";

interface ProductDetailPageProps {
  product: ProductDetail;
  preview?: { content: ReactNode; priceKnown: boolean };
}

export function ProductDetailPage({
  product,
  preview,
}: ProductDetailPageProps) {
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id);
  useEffect(() => {
    if (preview || !userId || (product.isMock && !publicEnv.apiMocking)) return;
    void recordRecentView(product.id).catch(() => {
      /* Nonessential history must not prevent viewing a product. */
    });
  }, [userId, product.id, product.isMock, preview]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [notice, setNotice] = useState<{
    id: number;
    message: string;
    action?: { label: string; onClick: () => void };
    placement: "page" | "purchase";
  } | null>(null);
  const noticeId = useRef(0);
  const handleNotify = useCallback<ProductNotify>((message, action) => {
    setNotice({ id: ++noticeId.current, message, action, placement: "page" });
  }, []);
  const handlePurchaseNotify = useCallback<ProductNotify>((message, action) => {
    setNotice({
      id: ++noticeId.current,
      message,
      action,
      placement: "purchase",
    });
  }, []);
  const handleLogin = useCallback(() => {
    const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    // searchParams와 safeReturnUrl에서 각각 한 번 디코딩한다.
    const loginUrl =
      `/login?returnUrl=${encodeURIComponent(encodeURIComponent(returnUrl))}` as const;
    // Next 16.3.4의 최초 경로 캐시가 복귀 시 해시를 중복해서 붙이는 경우를 피한다.
    if (window.location.hash) window.location.assign(loginUrl);
    else router.push(loginUrl);
  }, [router]);
  const handleRequireLogin = useCallback(
    (confirm = true) => {
      if (confirm) setIsLoginOpen(true);
      else handleLogin();
    },
    [handleLogin],
  );

  const toast = notice && (
    <Toast
      key={notice.id}
      className="h-auto min-h-11.5 w-full justify-between bg-bg-deam py-3 [&>span]:px-4"
      actionLabel={notice.action?.label}
      onAction={notice.action?.onClick}
    >
      {notice.message}
    </Toast>
  );

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return (
    <div className="mx-auto w-full max-w-desktop page-gutter pt-6 pb-24 text-font-dark md:pt-12">
      <div className="product-detail-grid min-w-0">
        <div className="min-w-0 md:col-start-1 md:row-start-1">
          <ProductDetailGallery
            images={product.images}
            productName={product.name}
            preview={!!preview}
          />
        </div>
        <aside
          aria-label="상품 정보 및 구매"
          className="min-w-0 md:col-start-2 md:row-span-2 md:row-start-1"
        >
          <div className="product-detail-aside">
            <ProductPurchasePanel
              product={product}
              preview={!!preview}
              priceKnown={preview?.priceKnown}
              onNotify={handlePurchaseNotify}
              onRequireLogin={handleRequireLogin}
              notice={notice?.placement === "purchase" ? toast : null}
            />
          </div>
        </aside>
        <div className="min-w-0 space-y-6 max-md:pt-2 md:col-start-1 md:row-start-2">
          <ProductInformation product={product} content={preview?.content} />
          <div className="space-y-6">
            <ProductReviews
              productId={product.id}
              preview={!!preview}
              isMock={product.isMock}
              onNotify={handleNotify}
              onRequireLogin={handleRequireLogin}
            />
            <ProductInquiries
              product={product}
              preview={!!preview}
              productId={product.id}
              isMock={product.isMock}
              onNotify={handleNotify}
              onRequireLogin={handleLogin}
            />
          </div>
          <RelatedProducts products={product.relatedProducts} />
        </div>
      </div>

      {!preview && <FloatingActions showAiChat={false} />}
      <Dialog
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        title="로그인 후 이용 가능한 서비스입니다"
        description="로그인 페이지로 이동하시겠습니까?"
        variant="confirmation"
      >
        <div className="flex gap-2.5">
          <Button
            variant="jade"
            size="xl"
            className="flex-1 border-border-neutral-subtle"
            onClick={() => setIsLoginOpen(false)}
          >
            취소
          </Button>
          <Button
            variant="solid"
            size="xl"
            className="flex-1"
            onClick={() => {
              setIsLoginOpen(false);
              handleLogin();
            }}
          >
            로그인하기
          </Button>
        </div>
      </Dialog>
      {notice?.placement === "page" && (
        <div
          className="fixed inset-x-4 bottom-6 z-80 flex justify-center"
          key={notice.id}
        >
          <div className="max-w-140">{toast}</div>
        </div>
      )}
    </div>
  );
}
