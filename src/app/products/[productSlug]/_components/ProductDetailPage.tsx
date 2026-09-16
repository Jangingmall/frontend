"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { FloatingActions } from "@/components/common/floating-actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import type { ProductDetail, ProductNotify } from "@/types/product-detail";

import { ProductDetailGallery } from "./ProductDetailGallery";
import { ProductInformation } from "./ProductInformation";
import { ProductInquiries } from "./ProductInquiries";
import { ProductPurchasePanel } from "./ProductPurchasePanel";
import { ProductReviews } from "./ProductReviews";
import { RelatedProducts } from "./RelatedProducts";

interface ProductDetailPageProps {
  product: ProductDetail;
}

export function ProductDetailPage({ product }: ProductDetailPageProps) {
  const router = useRouter();
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
    router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
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
    <div className="mx-auto w-full max-w-desktop px-4 pt-8 pb-24 text-font-dark sm:px-6 lg:px-12 lg:pt-12">
      <div className="grid min-w-0 grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,774fr)_minmax(0,522fr)]">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <ProductDetailGallery
            images={product.images}
            productName={product.name}
          />
        </div>
        <aside
          aria-label="상품 정보 및 구매"
          className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          {/* GNB(122px)와 PD 주석의 상단 여백(48px)을 함께 확보한다. */}
          <div className="lg:sticky lg:top-42.5 lg:max-h-[calc(100dvh-194px)] lg:overflow-y-auto lg:overscroll-contain">
            <ProductPurchasePanel
              product={product}
              onNotify={handlePurchaseNotify}
              onRequireLogin={handleRequireLogin}
              notice={notice?.placement === "purchase" ? toast : null}
            />
          </div>
        </aside>
        <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-2">
          <ProductInformation product={product} />
          <div className="space-y-6">
            <ProductReviews
              productId={product.id}
              isMock={product.isMock}
              onNotify={handleNotify}
              onRequireLogin={handleRequireLogin}
            />
            <ProductInquiries
              product={product}
              productId={product.id}
              isMock={product.isMock}
              onNotify={handleNotify}
              onRequireLogin={handleLogin}
            />
          </div>
          <RelatedProducts products={product.relatedProducts} />
        </div>
      </div>

      <FloatingActions showAiChat={false} />
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
