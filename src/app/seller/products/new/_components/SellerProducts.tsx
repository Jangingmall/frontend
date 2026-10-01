"use client";
import "./seller-api.css";

import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/ui/logo";
import { publicEnv } from "@/lib/env";
import { useSellerProducts } from "@/queries/seller-studio/queries";
import { useAuthStore } from "@/stores/auth";

import { SellerAccess } from "./SellerAccess";

function Products() {
  const [page, setPage] = useState(0);
  const query = useSellerProducts(
    page,
    true,
    useAuthStore((state) => state.user?.id ?? 0),
  );
  return (
    <div className="ss-shell">
      <header className="ss-header">
        <Link className="ss-logo" href="/" aria-label="미담 홈으로 이동">
          <Logo />
        </Link>
        <span>판매 관리</span>
      </header>
      {publicEnv.apiMocking && (
        <p className="sa-note">
          MSW 시연 · 실제 AI 생성이나 서버 DB 저장은 실행하지 않습니다.
        </p>
      )}
      <main className="ss-form-wrap sa-main">
        <div className="ss-heading">
          <h1>내 상품</h1>
          <Link href="/seller/products/new">AI 상세페이지 제작</Link>
        </div>
        {query.isPending ? (
          <p role="status">상품을 불러오고 있습니다.</p>
        ) : query.isError ? (
          <div role="alert">
            <p>상품 목록을 불러오지 못했습니다.</p>
            <button onClick={() => void query.refetch()}>다시 조회</button>
          </div>
        ) : (
          <>
            <p>총 {query.data.totalElements}개</p>
            {query.data.content.length === 0 ? (
              <p>등록한 상품이 없습니다.</p>
            ) : (
              <ul className="sa-products">
                {query.data.content.map((product) => (
                  <li key={product.productId}>
                    <h2>{product.title}</h2>
                    <p>
                      {product.price.toLocaleString()}원 · 재고 {product.stock}
                      개 · {product.status}
                    </p>
                    <Link
                      href={`/seller/products/new?productId=${product.productId}`}
                    >
                      상세페이지 작업하기
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <nav aria-label="상품 페이지">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>
                이전
              </button>
              <span>
                {page + 1} / {Math.max(1, query.data.totalPages)}
              </span>
              <button
                disabled={page + 1 >= query.data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                다음
              </button>
            </nav>
          </>
        )}
      </main>
    </div>
  );
}
export function SellerProducts() {
  return (
    <SellerAccess>
      <Products />
    </SellerAccess>
  );
}
