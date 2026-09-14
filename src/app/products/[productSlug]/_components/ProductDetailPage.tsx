"use client";

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
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [notice, setNotice] = useState<{
    id: number;
    message: string;
    action?: { label: string; onClick: () => void };
  } | null>(null);
  const noticeId = useRef(0);
  const handleNotify = useCallback<ProductNotify>((message, action) => {
    setNotice({ id: ++noticeId.current, message, action });
  }, []);
  const handleRequireLogin = useCallback(() => setIsLoginOpen(true), []);

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
          {/* 기존 sticky GNB(122px) 아래에 여백을 확보한다. */}
          <div className="lg:sticky lg:top-36.5 lg:max-h-[calc(100dvh-170px)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
            <ProductPurchasePanel
              product={product}
              onNotify={handleNotify}
              onRequireLogin={handleRequireLogin}
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
              onRequireLogin={handleRequireLogin}
            />
          </div>
          <RelatedProducts products={product.relatedProducts} />
        </div>
      </div>

      <FloatingActions showAiChat={false} />
      <Dialog
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        title="로그인이 필요한 기능입니다"
        description="로그인 후 관심 작품을 저장하고 주문·문의를 이용할 수 있습니다."
        className="max-w-100"
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="s"
            className="flex-1"
            onClick={() => setIsLoginOpen(false)}
          >
            취소
          </Button>
          <Button
            variant="solid"
            size="s"
            className="flex-1"
            onClick={() => {
              setIsLoginOpen(false);
              handleNotify("로그인 화면을 준비 중입니다.");
            }}
          >
            로그인
          </Button>
        </div>
      </Dialog>
      {notice && (
        <div
          className="fixed inset-x-4 bottom-6 z-80 flex justify-center"
          key={notice.id}
        >
          <Toast
            className="h-auto min-h-10 max-w-full py-1 [&>span]:px-3"
            actionLabel={notice.action?.label}
            onAction={
              notice.action
                ? () => {
                    notice.action?.onClick();
                  }
                : undefined
            }
          >
            {notice.message}
          </Toast>
        </div>
      )}
    </div>
  );
}
