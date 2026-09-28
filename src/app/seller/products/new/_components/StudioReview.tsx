"use client";
import Image from "next/image";
import { useState } from "react";

import { ContractPreview } from "./ContractPreview";
import type { StudioAsset, StudioDraft } from "./studio-contract";
import { buildPreview } from "./studio-contract";
interface Props {
  draft: StudioDraft;
  assets: StudioAsset[];
  onBack: () => void;
  onSave: () => void;
  onComplete: () => void;
  isCompleted: boolean;
}
export function StudioReview({
  draft,
  assets,
  onBack,
  onSave,
  onComplete,
  isCompleted,
}: Props) {
  const [device, setDevice] = useState("PC");
  const [photo, setPhoto] = useState(assets[0]);
  return (
    <>
      <header className="ss-review-header">
        <span className="ss-logo">로고</span>
        <button type="button" onClick={onBack}>
          ‹ 뒤로가기
        </button>
        <div className="ss-devices" aria-label="미리보기 기기">
          {["PC", "태블릿", "모바일"].map((label) => (
            <button
              type="button"
              key={label}
              aria-pressed={device === label}
              onClick={() => setDevice(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ss-review-actions">
          <button type="button" className="ss-button" onClick={onSave}>
            임시 저장
          </button>
          <button
            type="button"
            className="ss-button ss-primary"
            onClick={onComplete}
          >
            제작 완료
          </button>
        </div>
      </header>
      <div
        className={`ss-review-device ${device === "태블릿" ? "tablet" : device === "모바일" ? "mobile" : ""}`}
      >
        <div className="ss-preview-shop">
          <span className="ss-logo">로고</span>
          <div>
            전체 카테고리　　전체
            상품　　선물관　　장인관　　신상품　　베스트　　기획전
          </div>
        </div>
        <div className="ss-product-summary">
          <div className="ss-product-photos">
            <div>
              {assets.map((asset) => (
                <button
                  type="button"
                  key={asset.imageId}
                  aria-label={`${asset.alt} 미리보기`}
                  aria-pressed={asset.imageId === photo.imageId}
                  onClick={() => setPhoto(asset)}
                >
                  <Image
                    src={asset.url}
                    width={90}
                    height={90}
                    alt={asset.alt}
                    unoptimized
                  />
                </button>
              ))}
            </div>
            <Image
              src={photo.url}
              width={600}
              height={600}
              alt={photo.alt}
              unoptimized
            />
          </div>
          <div className="ss-product-copy">
            <h1>{draft.product_name}</h1>
            <p>상품 상세페이지 미리보기</p>
            <strong>판매 정보 등록 전</strong>
            <p>{draft.summary}</p>
            <hr />
            <dl>
              <dt>판매 가격</dt>
              <dd>미등록</dd>
              <dt>배송 정보</dt>
              <dd>미등록</dd>
              <dt>옵션</dt>
              <dd>미등록</dd>
            </dl>
            <p className="ss-preview-notice">
              상품 정보와 상세페이지 구성을 확인해 주세요. 이 화면에서는 구매 및
              게시가 진행되지 않습니다.
            </p>
          </div>
        </div>
        <div className="ss-product-detail">
          <h2>상품 상세정보</h2>
          <ContractPreview document={buildPreview(draft)} assets={assets} />
        </div>
      </div>
      <p className="ss-review-status" role="status">
        {isCompleted
          ? "제작 완료본을 이 브라우저에 저장했습니다. 실제 상품은 게시되지 않았습니다."
          : "시연 미리보기 · 상품을 게시하지 않으며 이 브라우저에만 저장됩니다."}
      </p>
    </>
  );
}
