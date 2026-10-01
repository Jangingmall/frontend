"use client";
import Image from "next/image";
import { useState } from "react";

import { Logo } from "@/components/ui/logo";
import { useSellerProduct } from "@/queries/seller-studio/queries";
import { useAuthStore } from "@/stores/auth";
import {
  flattenDocument,
  safeImageUrl,
  type StudioDocument,
} from "@/utils/seller-studio/document";

import { ServerDocument } from "./ServerDocument";

export function ServerStudioReview({
  productId,
  document,
  images,
  width,
}: {
  productId: number;
  document: StudioDocument;
  images: Record<string, string>;
  width: number;
}) {
  const ownerId = useAuthStore((state) => state.user?.id);
  const product = useSellerProduct(productId, ownerId);
  const sources = [
    ...new Set(
      flattenDocument(document)
        .filter((node) => node.tag === "img")
        .flatMap((node) => {
          const src =
            images[node.props?.imageId ?? ""] ??
            safeImageUrl(node.props?.src) ??
            safeImageUrl(node.props?.imageId);
          return src ? [src] : [];
        }),
    ),
  ];
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const photo = sources[selectedPhoto] ?? sources[0];
  return (
    <div
      className={`ss-review-device ${width === 600 ? "tablet" : width === 360 ? "mobile" : ""}`}
    >
      <div className="ss-preview-shop">
        <span className="ss-logo" role="img" aria-label="미담">
          <Logo />
        </span>
        <div>
          전체 카테고리　　전체
          상품　　선물관　　장인관　　신상품　　베스트　　기획전
        </div>
      </div>
      <div className="ss-product-summary">
        <div className="ss-product-photos">
          <div>
            {sources.map((src, index) => (
              <button
                key={src}
                aria-label={`${index + 1}번 사진 미리보기`}
                aria-pressed={index === selectedPhoto}
                onClick={() => setSelectedPhoto(index)}
              >
                {failed.includes(src) ? (
                  <span>이미지 없음</span>
                ) : (
                  <Image
                    src={src}
                    width={90}
                    height={90}
                    alt={`작품 사진 ${index + 1}`}
                    unoptimized
                    onError={() => setFailed((current) => [...current, src])}
                  />
                )}
              </button>
            ))}
          </div>
          {photo && !failed.includes(photo) ? (
            <Image
              src={photo}
              width={600}
              height={600}
              alt="작품 대표 사진"
              unoptimized
              onError={() => setFailed((current) => [...current, photo])}
            />
          ) : (
            <div className="sa-image-missing">이미지를 불러올 수 없습니다.</div>
          )}
        </div>
        <div className="ss-product-copy">
          <h2>{product.data?.title ?? "상품 상세페이지 미리보기"}</h2>
          {product.data && (
            <strong>{product.data.price.toLocaleString("ko-KR")}원</strong>
          )}
          <p>AI로 작성한 상세페이지와 작품 사진을 확인해 주세요.</p>
          <hr />
          <dl>
            <dt>판매 가격</dt>
            <dd>
              {product.data
                ? `${product.data.price.toLocaleString("ko-KR")}원`
                : "상품 정보 확인 필요"}
            </dd>
            <dt>재고</dt>
            <dd>
              {product.data ? `${product.data.stock}개` : "상품 정보 확인 필요"}
            </dd>
            <dt>배송·옵션</dt>
            <dd>상품 판매 정보에서 확인</dd>
          </dl>
          {product.isError && (
            <p>
              상품 기본정보를 불러오지 못했습니다. 상세페이지 내용은 아래에서
              확인할 수 있습니다.
            </p>
          )}
          <p className="ss-preview-notice">
            미리보기 화면입니다. 제작 완료하기에서 내용을 확인한 뒤 게시할 수
            있습니다.
          </p>
        </div>
      </div>
      <div className="ss-product-detail">
        <h2>상품 상세정보</h2>
        <ServerDocument document={document} images={images} />
      </div>
    </div>
  );
}
