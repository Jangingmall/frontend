import "./globals.css";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { fetchProductCategoriesServer } from "@/api/products/api";
import { Footer } from "@/components/common/footer";
import { getQueryClient } from "@/lib/query/server";
import { themeInitScript } from "@/lib/theme";
import { productKeys } from "@/queries/products/keys";

import { AuthBootstrap } from "./auth-bootstrap";
import { ConsumerChrome } from "./ConsumerChrome";
import { pretendard } from "./fonts";
import { MockIdentitySwitcher } from "./mock-identity-switcher-loader";
import { QueryProvider } from "./query-provider";
import { SiteGnb } from "./site-gnb";
import { ThemeSync } from "./theme-sync";

export const metadata: Metadata = {
  title: "장인몰",
  description: "장인몰 프론트엔드",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // GNB 분류를 서버에서 미리 채운다(`product-taxonomy` ISR 캐시, 24h). 실패는 삼킨다 — 분류 때문에
  // 모든 화면 렌더가 막히면 안 되고, 실패한 조회는 dehydrate되지 않아 클라이언트가 다시 시도한다.
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: productKeys.categories,
    queryFn: () => fetchProductCategoriesServer(),
  });
  return (
    // `suppressHydrationWarning`: 아래 인라인 스크립트가 하이드레이션 전에 `<html>` 의 `dark`
    // 클래스를 바꾸기 때문이다(서버 마크업은 항상 라이트).
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* 첫 페인트 전에 테마를 적용해 라이트→다크 깜빡임을 막는다(`lib/theme.ts`). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <AuthBootstrap>
              <ThemeSync />
              <ConsumerChrome>
                <SiteGnb />
              </ConsumerChrome>
              <main className="flex flex-1 flex-col">{children}</main>
              <ConsumerChrome>
                <Footer />
              </ConsumerChrome>
              <ConsumerChrome>
                <MockIdentitySwitcher />
              </ConsumerChrome>
            </AuthBootstrap>
          </HydrationBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
